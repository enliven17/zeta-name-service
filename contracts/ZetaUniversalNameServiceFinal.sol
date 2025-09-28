// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

// ZetaChain Universal App pattern için final implementasyon
interface IZetaGateway {
    function call(
        address receiver,
        bytes calldata payload,
        RevertOptions calldata revertOptions
    ) external payable;
}

struct MessageContext {
    bytes sender;
    address senderEVM;
    uint256 chainID;
}

struct RevertContext {
    address sender;
    address asset;
    uint256 amount;
    bytes revertMessage;
}

struct RevertOptions {
    address revertAddress;
    bool callOnRevert;
    address abortAddress;
    bytes revertMessage;
    uint256 onRevertGasLimit;
}

struct DomainRecord {
    address owner;
    uint64 expiresAt;
    uint256 sourceChainId;
    bool isOmnichain;
}

/// @title ZetaChain Universal Name Service (Final Implementation)
/// @notice Cross-chain domain name service using ZetaChain Universal App pattern
contract ZetaUniversalNameServiceFinal {
    event Registered(
        string indexed name, 
        address indexed owner, 
        uint256 expiresAt, 
        uint256 chainId,
        bool isOmnichain
    );
    event CrossChainTransfer(
        string indexed name,
        address indexed from,
        address indexed to,
        uint256 sourceChainId,
        uint256 targetChainId,
        bytes32 messageId
    );
    event DomainMinted(
        string indexed name,
        address indexed owner,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event RevertEvent(string message, bytes revertData);

    IZetaGateway public immutable gateway;
    
    // name (lowercase) => record
    mapping(string => DomainRecord) private nameToRecord;
    
    // Cross-chain message tracking
    mapping(bytes32 => bool) public processedMessages;

    uint256 public constant REGISTRATION_DURATION = 365 days;
    uint256 public constant BASE_REGISTRATION_PRICE = 0.001 ether;

    // Cross-chain message types
    uint8 constant CROSS_CHAIN_MINT = 1;
    
    // Gas limits for cross-chain operations
    uint256 constant CROSS_CHAIN_GAS_LIMIT = 500000;

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "ONLY_GATEWAY");
        _;
    }

    constructor(address gatewayAddress) {
        require(gatewayAddress != address(0), "GATEWAY_ZERO");
        gateway = IZetaGateway(gatewayAddress);
    }

    function _toLower(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        for (uint256 i = 0; i < bStr.length; i++) {
            uint8 c = uint8(bStr[i]);
            if (c >= 65 && c <= 90) {
                bStr[i] = bytes1(c + 32);
            }
        }
        return string(bStr);
    }

    function _isExpired(DomainRecord memory rec) internal view returns (bool) {
        return rec.expiresAt < block.timestamp;
    }

    function isAvailable(string calldata name) external view returns (bool) {
        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        return rec.owner == address(0) || _isExpired(rec);
    }

    function ownerOf(string calldata name) external view returns (address) {
        DomainRecord memory rec = nameToRecord[_toLower(name)];
        if (rec.owner == address(0) || _isExpired(rec)) return address(0);
        return rec.owner;
    }

    function getDomainInfo(string calldata name) external view returns (
        address owner,
        uint64 expiration,
        uint256 sourceChainId,
        bool isOmnichain,
        bool isExpired
    ) {
        DomainRecord memory rec = nameToRecord[_toLower(name)];
        return (
            rec.owner,
            rec.expiresAt,
            rec.sourceChainId,
            rec.isOmnichain,
            _isExpired(rec)
        );
    }

    function register(string calldata name, bool makeOmnichain) external payable {
        uint256 currentChainId = block.chainid;
        uint256 price = currentChainId == 11155111 ? BASE_REGISTRATION_PRICE * 2 : BASE_REGISTRATION_PRICE;
        require(msg.value == price, "INCORRECT_PRICE");

        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == address(0) || _isExpired(rec), "DOMAIN_TAKEN");

        uint64 newExpiry = uint64(block.timestamp + REGISTRATION_DURATION);
        nameToRecord[n] = DomainRecord({
            owner: msg.sender,
            expiresAt: newExpiry,
            sourceChainId: currentChainId,
            isOmnichain: makeOmnichain
        });

        emit Registered(n, msg.sender, newExpiry, currentChainId, makeOmnichain);
    }

    // Cross-chain transfer using final Universal App pattern
    function crossChainTransfer(
        string calldata name,
        address to,
        uint256 targetChainId
    ) external {
        uint256 currentChainId = block.chainid;
        require(to != address(0), "INVALID_RECIPIENT");
        require(targetChainId != currentChainId, "SAME_CHAIN");

        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == msg.sender, "NOT_OWNER");
        require(!_isExpired(rec), "DOMAIN_EXPIRED");
        require(rec.isOmnichain, "NOT_OMNICHAIN");

        // Generate unique message ID
        bytes32 messageId = keccak256(abi.encodePacked(
            n, msg.sender, to, currentChainId, targetChainId, block.timestamp
        ));

        // Mark message as processed
        processedMessages[messageId] = true;

        // Burn domain on source chain
        delete nameToRecord[n];

        // Prepare cross-chain message
        bytes memory message = abi.encode(
            CROSS_CHAIN_MINT,
            n,
            to,
            rec.expiresAt,
            rec.isOmnichain,
            messageId
        );

        // Prepare revert options - simplified for testing
        RevertOptions memory revertOptions = RevertOptions({
            revertAddress: msg.sender,
            callOnRevert: false, // Disable revert callback for testing
            abortAddress: address(this),
            revertMessage: abi.encode("Domain transfer failed"),
            onRevertGasLimit: 0
        });

        // Make cross-chain call using final pattern
        try gateway.call{value: 0}(
            address(this), // Target contract (same address on target chain)
            message,
            revertOptions
        ) {
            emit CrossChainTransfer(n, msg.sender, to, currentChainId, targetChainId, messageId);
        } catch Error(string memory reason) {
            // Revert the domain deletion if call fails
            nameToRecord[n] = rec;
            revert(string(abi.encodePacked("Cross-chain call failed: ", reason)));
        } catch {
            // Revert the domain deletion if call fails
            nameToRecord[n] = rec;
            revert("Cross-chain call failed");
        }
    }

    // Universal App onCall handler - receives cross-chain messages
    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway {
        (
            uint8 messageType,
            string memory domainName,
            address recipient,
            uint64 domainExpiresAt,
            bool isOmnichain,
            bytes32 messageId
        ) = abi.decode(message, (uint8, string, address, uint64, bool, bytes32));

        // Prevent replay attacks
        require(!processedMessages[messageId], "MESSAGE_ALREADY_PROCESSED");
        processedMessages[messageId] = true;

        if (messageType == CROSS_CHAIN_MINT) {
            // Mint domain on target chain
            nameToRecord[domainName] = DomainRecord({
                owner: recipient,
                expiresAt: domainExpiresAt,
                sourceChainId: context.chainID,
                isOmnichain: isOmnichain
            });

            emit DomainMinted(
                domainName,
                recipient,
                context.chainID,
                block.chainid
            );

            emit Registered(
                domainName,
                recipient,
                domainExpiresAt,
                block.chainid,
                isOmnichain
            );
        }
    }

    // Universal App onRevert handler
    function onRevert(RevertContext calldata revertContext) external payable onlyGateway {
        emit RevertEvent("Cross-chain transfer reverted", revertContext.revertMessage);
    }

    function getSupportedChains() external pure returns (uint256[] memory) {
        uint256[] memory chains = new uint256[](2);
        chains[0] = 421614; // Arbitrum Sepolia
        chains[1] = 11155111; // Ethereum Sepolia
        return chains;
    }

    function withdraw(address payable to) external {
        require(to != address(0), "INVALID_RECIPIENT");
        to.transfer(address(this).balance);
    }
}

