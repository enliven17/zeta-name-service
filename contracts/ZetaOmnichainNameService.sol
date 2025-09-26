// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ZetaChain Omnichain Name Service
/// @notice Cross-chain domain name service supporting multiple blockchains via ZetaChain
contract ZetaOmnichainNameService is Ownable {
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

    // name (lowercase) => record
    mapping(string => DomainRecord) private nameToRecord;
    
    // chainId => chain configuration
    mapping(uint256 => ChainConfig) public supportedChains;
    
    // Cross-chain message tracking
    mapping(bytes32 => bool) public processedMessages;

    uint256 public constant REGISTRATION_DURATION = 365 days;
    uint256 public constant BASE_REGISTRATION_PRICE = 0.001 ether;
    uint256 public constant BASE_TRANSFER_FEE = 0.0001 ether;

    // ZetaChain specific addresses (will be set during deployment)
    address public zetaConnector;
    address public zetaToken;
    address public tssAddress;

    event Registered(
        string indexed name, 
        address indexed owner, 
        uint256 expiresAt, 
        uint256 chainId,
        bool isOmnichain
    );
    event Renewed(string indexed name, uint256 newExpiresAt);
    event Transferred(
        string indexed name, 
        address indexed from, 
        address indexed to,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event CrossChainTransfer(
        string indexed name,
        address indexed from,
        address indexed to,
        uint256 sourceChainId,
        uint256 targetChainId,
        bytes32 messageId
    );
    event ChainAdded(uint256 chainId, uint256 registrationPrice, uint256 transferFee);
    event ChainUpdated(uint256 chainId, bool isSupported);
    event ZetaConfigUpdated(address connector, address token, address tss);

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
        
        // Initialize Arbitrum Sepolia as primary chain
        supportedChains[421614] = ChainConfig({
            isSupported: true,
            registrationPrice: BASE_REGISTRATION_PRICE,
            transferFee: BASE_TRANSFER_FEE,
            rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
            explorerUrl: "https://sepolia.arbiscan.io"
        });

        // Initialize ZetaChain Testnet
        supportedChains[7001] = ChainConfig({
            isSupported: true,
            registrationPrice: BASE_REGISTRATION_PRICE,
            transferFee: BASE_TRANSFER_FEE,
            rpcUrl: "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
            explorerUrl: "https://athens.explorer.zetachain.com"
        });
    }

    function setZetaConfig(
        address _connector,
        address _token,
        address _tss
    ) external onlyOwner {
        zetaConnector = _connector;
        zetaToken = _token;
        tssAddress = _tss;
        emit ZetaConfigUpdated(_connector, _token, _tss);
    }

    function addSupportedChain(
        uint256 chainId,
        uint256 registrationPrice,
        uint256 transferFee,
        string calldata rpcUrl,
        string calldata explorerUrl
    ) external onlyOwner {
        supportedChains[chainId] = ChainConfig({
            isSupported: true,
            registrationPrice: registrationPrice,
            transferFee: transferFee,
            rpcUrl: rpcUrl,
            explorerUrl: explorerUrl
        });
        emit ChainAdded(chainId, registrationPrice, transferFee);
    }

    function updateChainSupport(uint256 chainId, bool isSupported) external onlyOwner {
        require(supportedChains[chainId].registrationPrice > 0, "CHAIN_NOT_EXISTS");
        supportedChains[chainId].isSupported = isSupported;
        emit ChainUpdated(chainId, isSupported);
    }

    function _isExpired(DomainRecord memory rec) internal view returns (bool) {
        return rec.expiresAt < block.timestamp;
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

    function expiresAt(string calldata name) external view returns (uint64) {
        return nameToRecord[_toLower(name)].expiresAt;
    }

    function getDomainInfo(string calldata name) external view returns (
        address owner,
        uint64 expiresAt,
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

    function renew(string calldata name) external payable {
        uint256 currentChainId = block.chainid;
        ChainConfig memory chainConfig = supportedChains[currentChainId];
        require(chainConfig.isSupported, "CHAIN_NOT_SUPPORTED");
        require(msg.value == chainConfig.registrationPrice, "INCORRECT_PRICE");

        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == msg.sender, "NOT_OWNER");
        require(!_isExpired(rec), "DOMAIN_EXPIRED");

        uint64 newExpiry = rec.expiresAt + uint64(REGISTRATION_DURATION);
        nameToRecord[n].expiresAt = newExpiry;
        emit Renewed(n, newExpiry);
    }

    function transfer(string calldata name, address to) external payable {
        uint256 currentChainId = block.chainid;
        ChainConfig memory chainConfig = supportedChains[currentChainId];
        require(chainConfig.isSupported, "CHAIN_NOT_SUPPORTED");
        require(msg.value == chainConfig.transferFee, "INCORRECT_FEE");
        require(to != address(0), "INVALID_RECIPIENT");

        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == msg.sender, "NOT_OWNER");
        require(!_isExpired(rec), "DOMAIN_EXPIRED");

        nameToRecord[n].owner = to;
        emit Transferred(n, msg.sender, to, currentChainId, currentChainId);
    }

    function crossChainTransfer(
        string calldata name,
        address to,
        uint256 targetChainId
    ) external payable {
        uint256 currentChainId = block.chainid;
        ChainConfig memory sourceChainConfig = supportedChains[currentChainId];
        ChainConfig memory targetChainConfig = supportedChains[targetChainId];
        
        require(sourceChainConfig.isSupported, "SOURCE_CHAIN_NOT_SUPPORTED");
        require(targetChainConfig.isSupported, "TARGET_CHAIN_NOT_SUPPORTED");
        require(msg.value == sourceChainConfig.transferFee, "INCORRECT_FEE");
        require(to != address(0), "INVALID_RECIPIENT");
        require(targetChainId != currentChainId, "SAME_CHAIN");

        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == msg.sender, "NOT_OWNER");
        require(!_isExpired(rec), "DOMAIN_EXPIRED");
        require(rec.isOmnichain, "NOT_OMNICHAIN");

        // Generate unique message ID for cross-chain tracking
        bytes32 messageId = keccak256(abi.encodePacked(
            n, msg.sender, to, currentChainId, targetChainId, block.timestamp
        ));

        // Update domain record for cross-chain transfer
        nameToRecord[n].owner = to;
        nameToRecord[n].sourceChainId = targetChainId;

        emit CrossChainTransfer(n, msg.sender, to, currentChainId, targetChainId, messageId);
        emit Transferred(n, msg.sender, to, currentChainId, targetChainId);
    }

    function processCrossChainMessage(
        bytes32 messageId,
        string calldata name,
        address from,
        address to,
        uint256 sourceChainId
    ) external {
        require(msg.sender == zetaConnector || msg.sender == tssAddress, "UNAUTHORIZED");
        require(!processedMessages[messageId], "MESSAGE_PROCESSED");
        require(supportedChains[sourceChainId].isSupported, "INVALID_SOURCE_CHAIN");

        string memory n = _toLower(name);
        processedMessages[messageId] = true;

        // Update domain ownership from cross-chain message
        nameToRecord[n].owner = to;
        nameToRecord[n].sourceChainId = block.chainid;

        emit Transferred(n, from, to, sourceChainId, block.chainid);
    }

    function getSupportedChains() external view returns (uint256[] memory) {
        // Return list of supported chain IDs
        uint256[] memory chains = new uint256[](5);
        chains[0] = 421614; // Arbitrum Sepolia
        chains[1] = 7001;   // ZetaChain Testnet
        chains[2] = 11155111; // Ethereum Sepolia
        chains[3] = 97;     // BSC Testnet
        chains[4] = 80001;  // Polygon Mumbai
        return chains;
    }

    function getChainConfig(uint256 chainId) external view returns (ChainConfig memory) {
        return supportedChains[chainId];
    }

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "INVALID_RECIPIENT");
        to.transfer(address(this).balance);
    }

    // Emergency functions
    function emergencyUpdateDomain(
        string calldata name,
        address newOwner,
        uint64 newExpiry
    ) external onlyOwner {
        string memory n = _toLower(name);
        nameToRecord[n].owner = newOwner;
        nameToRecord[n].expiresAt = newExpiry;
    }

    function pause() external onlyOwner {
        // Implement pause functionality if needed
    }

    function unpause() external onlyOwner {
        // Implement unpause functionality if needed
    }
}