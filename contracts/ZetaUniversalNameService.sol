// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

// ZetaChain Universal App interfaces
interface IZetaGateway {
    function call(
        bytes calldata receiver,
        address zrc20,
        bytes calldata message,
        bytes calldata callOptions,
        bytes calldata revertOptions
    ) external;
    
    function withdrawAndCall(
        bytes calldata receiver,
        uint256 amount,
        address zrc20,
        bytes calldata message,
        bytes calldata callOptions,
        bytes calldata revertOptions
    ) external;
}

interface IZRC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function withdrawGasFeeWithGasLimit(uint256 gasLimit) external view returns (address, uint256);
}

struct MessageContext {
    bytes sourceAddress;
    uint256 sourceChainId;
}

struct RevertContext {
    bytes revertMessage;
}

struct DomainRecord {
    address owner;
    uint64 expiresAt;
    uint256 sourceChainId;
    bool isOmnichain;
}

struct ChainConfig {
    bool isSupported;
    uint256 registrationPrice;
    uint256 transferFee;
    string rpcUrl;
    string explorerUrl;
}

/// @title ZetaChain Universal Name Service
/// @notice Cross-chain domain name service using ZetaChain Universal App pattern
contract ZetaUniversalNameService {
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
    
    // chainId => chain configuration
    mapping(uint256 => ChainConfig) public supportedChains;
    
    // Cross-chain message tracking
    mapping(bytes32 => bool) public processedMessages;

    uint256 public constant REGISTRATION_DURATION = 365 days;
    uint256 public constant BASE_REGISTRATION_PRICE = 0.001 ether;
    uint256 public constant BASE_TRANSFER_FEE = 0.0001 ether;

    // Cross-chain message types
    uint8 constant CROSS_CHAIN_MINT = 1;
    uint8 constant CROSS_CHAIN_BURN = 2;
    
    // Gas limits for cross-chain operations
    uint256 constant CROSS_CHAIN_GAS_LIMIT = 500000;

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "ONLY_GATEWAY");
        _;
    }

    constructor(address gatewayAddress) {
        require(gatewayAddress != address(0), "GATEWAY_ZERO");
        gateway = IZetaGateway(gatewayAddress);
        
        // Initialize supported chains
        supportedChains[421614] = ChainConfig({
            isSupported: true,
            registrationPrice: BASE_REGISTRATION_PRICE,
            transferFee: BASE_TRANSFER_FEE,
            rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
            explorerUrl: "https://sepolia.arbiscan.io"
        });

        supportedChains[11155111] = ChainConfig({
            isSupported: true,
            registrationPrice: BASE_REGISTRATION_PRICE * 2,
            transferFee: BASE_TRANSFER_FEE * 2,
            rpcUrl: "https://1rpc.io/sepolia",
            explorerUrl: "https://sepolia.etherscan.io"
        });
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
        ChainConfig memory chainConfig = supportedChains[currentChainId];
        require(chainConfig.isSupported, "CHAIN_NOT_SUPPORTED");
        require(msg.value == chainConfig.registrationPrice, "INCORRECT_PRICE");

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

    function crossChainTransfer(
        string calldata name,
        address to,
        uint256 targetChainId,
        address zrc20GasToken
    ) external {
        uint256 currentChainId = block.chainid;
        
        require(supportedChains[currentChainId].isSupported, "SOURCE_CHAIN_NOT_SUPPORTED");
        require(supportedChains[targetChainId].isSupported, "TARGET_CHAIN_NOT_SUPPORTED");
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

        // Get gas fee for target chain
        (address gasToken, uint256 gasFee) = IZRC20(zrc20GasToken).withdrawGasFeeWithGasLimit(CROSS_CHAIN_GAS_LIMIT);
        
        // Approve gas fee
        IZRC20(zrc20GasToken).approve(address(gateway), gasFee);

        // Prepare call options and revert options
        bytes memory callOptions = abi.encode(CROSS_CHAIN_GAS_LIMIT, false);
        bytes memory revertOptions = abi.encode(
            msg.sender,
            true,
            address(this),
            abi.encode("Domain transfer failed"),
            uint256(0)
        );

        // Make cross-chain call
        gateway.call(
            abi.encodePacked(address(this)),
            zrc20GasToken,
            message,
            callOptions,
            revertOptions
        );

        emit CrossChainTransfer(n, msg.sender, to, currentChainId, targetChainId, messageId);
    }

    // Universal App onCall handler - receives cross-chain messages
    function onCall(
        MessageContext calldata context,
        address /*zrc20*/,
        uint256 /*amount*/,
        bytes calldata message
    ) external onlyGateway {
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
                sourceChainId: context.sourceChainId,
                isOmnichain: isOmnichain
            });

            emit DomainMinted(
                domainName,
                recipient,
                context.sourceChainId,
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
    function onRevert(RevertContext calldata revertContext) external onlyGateway {
        emit RevertEvent("Cross-chain transfer reverted", revertContext.revertMessage);
        
        // Here you could implement logic to restore the domain on source chain
        // or refund the user, etc.
    }

    function getSupportedChains() external view returns (uint256[] memory) {
        uint256[] memory chains = new uint256[](2);
        chains[0] = 421614; // Arbitrum Sepolia
        chains[1] = 11155111; // Ethereum Sepolia
        return chains;
    }

    function getChainConfig(uint256 chainId) external view returns (ChainConfig memory) {
        return supportedChains[chainId];
    }

    function withdraw(address payable to) external {
        require(to != address(0), "INVALID_RECIPIENT");
        to.transfer(address(this).balance);
    }
}
