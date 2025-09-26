// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IZetaOmnichainNameService {
    function ownerOf(string calldata name) external view returns (address);
    function getDomainInfo(string calldata name) external view returns (
        address owner,
        uint64 expiresAt,
        uint256 sourceChainId,
        bool isOmnichain,
        bool isExpired
    );
    function crossChainTransfer(string calldata name, address to, uint256 targetChainId) external payable;
}

/// @title ZetaChain Omnichain Marketplace
/// @notice Cross-chain marketplace for trading .zeta domains across multiple blockchains
contract ZetaOmnichainMarketplace is Ownable {
    struct Listing {
        address seller;
        uint256 price;
        uint256 chainId;
        bool active;
        bool allowCrossChain;
        uint256 listedAt;
    }

    struct CrossChainOffer {
        address buyer;
        uint256 offerPrice;
        uint256 sourceChainId;
        uint256 targetChainId;
        uint256 expiresAt;
        bool active;
    }

    // name(lowercase) => listing
    mapping(string => Listing) public listings;
    
    // name => buyer address => offer
    mapping(string => mapping(address => CrossChainOffer)) public crossChainOffers;
    
    // Chain-specific configurations
    mapping(uint256 => bool) public supportedChains;
    mapping(uint256 => uint256) public listingFees;

    uint256 public constant BASE_LISTING_FEE = 0.0001 ether;
    uint256 public constant OFFER_DURATION = 7 days;
    uint256 public marketplaceFeePercent = 250; // 2.5%
    
    IZetaOmnichainNameService public immutable nameService;

    // ZetaChain integration
    address public zetaConnector;
    address public zetaToken;
    
    event Listed(
        string indexed name, 
        address indexed seller, 
        uint256 price, 
        uint256 chainId,
        bool allowCrossChain
    );
    event Unlisted(string indexed name, address indexed seller);
    event Purchased(
        string indexed name, 
        address indexed seller, 
        address indexed buyer, 
        uint256 price,
        uint256 chainId
    );
    event CrossChainPurchased(
        string indexed name,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event OfferMade(
        string indexed name,
        address indexed buyer,
        uint256 offerPrice,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event OfferAccepted(
        string indexed name,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event OfferCancelled(string indexed name, address indexed buyer);
    event ChainSupportUpdated(uint256 chainId, bool supported, uint256 listingFee);
    event MarketplaceFeeUpdated(uint256 newFeePercent);

    constructor(address ns, address initialOwner) {
        require(ns != address(0), "INVALID_NAME_SERVICE");
        nameService = IZetaOmnichainNameService(ns);
        _transferOwnership(initialOwner);
        
        // Initialize supported chains
        supportedChains[421614] = true; // Arbitrum Sepolia
        supportedChains[7001] = true;   // ZetaChain Testnet
        
        listingFees[421614] = BASE_LISTING_FEE;
        listingFees[7001] = BASE_LISTING_FEE;
    }

    function setZetaConfig(address _connector, address _token) external onlyOwner {
        zetaConnector = _connector;
        zetaToken = _token;
    }

    function updateChainSupport(
        uint256 chainId, 
        bool supported, 
        uint256 listingFee
    ) external onlyOwner {
        supportedChains[chainId] = supported;
        listingFees[chainId] = listingFee;
        emit ChainSupportUpdated(chainId, supported, listingFee);
    }

    function setMarketplaceFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "FEE_TOO_HIGH"); // Max 10%
        marketplaceFeePercent = newFeePercent;
        emit MarketplaceFeeUpdated(newFeePercent);
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

    function list(
        string calldata name, 
        uint256 price, 
        bool allowCrossChain
    ) external payable {
        uint256 currentChainId = block.chainid;
        require(supportedChains[currentChainId], "CHAIN_NOT_SUPPORTED");
        require(msg.value == listingFees[currentChainId], "INCORRECT_LISTING_FEE");
        
        string memory n = _toLower(name);
        require(nameService.ownerOf(n) == msg.sender, "NOT_OWNER");
        require(price > 0, "INVALID_PRICE");
        
        // Check if domain is omnichain if cross-chain listing is requested
        if (allowCrossChain) {
            (, , , bool isOmnichain, ) = nameService.getDomainInfo(n);
            require(isOmnichain, "NOT_OMNICHAIN_DOMAIN");
        }

        listings[n] = Listing({
            seller: msg.sender,
            price: price,
            chainId: currentChainId,
            active: true,
            allowCrossChain: allowCrossChain,
            listedAt: block.timestamp
        });

        emit Listed(n, msg.sender, price, currentChainId, allowCrossChain);
    }

    function unlist(string calldata name) external {
        string memory n = _toLower(name);
        Listing memory listing = listings[n];
        require(listing.active, "NOT_LISTED");
        require(listing.seller == msg.sender, "NOT_SELLER");

        delete listings[n];
        emit Unlisted(n, msg.sender);
    }

    function buy(string calldata name) external payable {
        string memory n = _toLower(name);
        Listing memory listing = listings[n];
        require(listing.active, "NOT_LISTED");
        require(listing.chainId == block.chainid, "WRONG_CHAIN");
        require(msg.value == listing.price, "INCORRECT_PRICE");

        // Calculate marketplace fee
        uint256 marketplaceFee = (listing.price * marketplaceFeePercent) / 10000;
        uint256 sellerAmount = listing.price - marketplaceFee;

        // Remove listing
        delete listings[n];

        // Transfer domain ownership (handled by name service)
        // Note: This would need integration with the name service transfer function

        // Pay seller
        (bool success, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(success, "SELLER_PAYMENT_FAILED");

        emit Purchased(n, listing.seller, msg.sender, listing.price, block.chainid);
    }

    function makeCrossChainOffer(
        string calldata name,
        uint256 targetChainId
    ) external payable {
        require(supportedChains[targetChainId], "TARGET_CHAIN_NOT_SUPPORTED");
        require(msg.value > 0, "INVALID_OFFER_AMOUNT");
        
        string memory n = _toLower(name);
        Listing memory listing = listings[n];
        
        // Check if domain allows cross-chain trading
        if (listing.active) {
            require(listing.allowCrossChain, "CROSS_CHAIN_NOT_ALLOWED");
        }

        // Cancel existing offer if any
        CrossChainOffer storage existingOffer = crossChainOffers[n][msg.sender];
        if (existingOffer.active) {
            // Refund existing offer
            (bool refundSuccess, ) = payable(msg.sender).call{value: existingOffer.offerPrice}("");
            require(refundSuccess, "REFUND_FAILED");
        }

        // Create new offer
        crossChainOffers[n][msg.sender] = CrossChainOffer({
            buyer: msg.sender,
            offerPrice: msg.value,
            sourceChainId: block.chainid,
            targetChainId: targetChainId,
            expiresAt: block.timestamp + OFFER_DURATION,
            active: true
        });

        emit OfferMade(n, msg.sender, msg.value, block.chainid, targetChainId);
    }

    function acceptCrossChainOffer(
        string calldata name,
        address buyer
    ) external {
        string memory n = _toLower(name);
        require(nameService.ownerOf(n) == msg.sender, "NOT_OWNER");
        
        CrossChainOffer storage offer = crossChainOffers[n][buyer];
        require(offer.active, "NO_ACTIVE_OFFER");
        require(offer.expiresAt > block.timestamp, "OFFER_EXPIRED");

        uint256 offerPrice = offer.offerPrice;
        uint256 sourceChainId = offer.sourceChainId;
        uint256 targetChainId = offer.targetChainId;

        // Deactivate offer
        offer.active = false;

        // Calculate marketplace fee
        uint256 marketplaceFee = (offerPrice * marketplaceFeePercent) / 10000;
        uint256 sellerAmount = offerPrice - marketplaceFee;

        // Remove any existing listing
        if (listings[n].active) {
            delete listings[n];
        }

        // Initiate cross-chain transfer through name service
        // This would require integration with ZetaChain's cross-chain messaging

        // Pay seller
        (bool success, ) = payable(msg.sender).call{value: sellerAmount}("");
        require(success, "SELLER_PAYMENT_FAILED");

        emit OfferAccepted(n, msg.sender, buyer, offerPrice, sourceChainId, targetChainId);
        emit CrossChainPurchased(n, msg.sender, buyer, offerPrice, sourceChainId, targetChainId);
    }

    function cancelOffer(string calldata name) external {
        string memory n = _toLower(name);
        CrossChainOffer storage offer = crossChainOffers[n][msg.sender];
        require(offer.active, "NO_ACTIVE_OFFER");

        uint256 refundAmount = offer.offerPrice;
        offer.active = false;

        // Refund buyer
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "REFUND_FAILED");

        emit OfferCancelled(n, msg.sender);
    }

    function getOffer(
        string calldata name, 
        address buyer
    ) external view returns (CrossChainOffer memory) {
        return crossChainOffers[_toLower(name)][buyer];
    }

    function isListingActive(string calldata name) external view returns (bool) {
        return listings[_toLower(name)].active;
    }

    function getListingInfo(string calldata name) external view returns (
        address seller,
        uint256 price,
        uint256 chainId,
        bool allowCrossChain,
        uint256 listedAt
    ) {
        Listing memory listing = listings[_toLower(name)];
        return (
            listing.seller,
            listing.price,
            listing.chainId,
            listing.allowCrossChain,
            listing.listedAt
        );
    }

    function getSupportedChains() external view returns (uint256[] memory) {
        uint256[] memory chains = new uint256[](5);
        chains[0] = 421614; // Arbitrum Sepolia
        chains[1] = 7001;   // ZetaChain Testnet
        chains[2] = 11155111; // Ethereum Sepolia
        chains[3] = 97;     // BSC Testnet
        chains[4] = 80001;  // Polygon Mumbai
        return chains;
    }

    function getListingFee(uint256 chainId) external view returns (uint256) {
        return listingFees[chainId];
    }

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "INVALID_RECIPIENT");
        to.transfer(address(this).balance);
    }

    // Emergency functions
    function emergencyUnlist(string calldata name) external onlyOwner {
        delete listings[_toLower(name)];
        emit Unlisted(_toLower(name), address(0));
    }

    function emergencyCancelOffer(string calldata name, address buyer) external onlyOwner {
        string memory n = _toLower(name);
        CrossChainOffer storage offer = crossChainOffers[n][buyer];
        if (offer.active) {
            uint256 refundAmount = offer.offerPrice;
            offer.active = false;
            
            (bool success, ) = payable(buyer).call{value: refundAmount}("");
            require(success, "EMERGENCY_REFUND_FAILED");
            
            emit OfferCancelled(n, buyer);
        }
    }
}