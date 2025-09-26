// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IZetaNameService {
    function ownerOf(string calldata name) external view returns (address);
    function marketTransfer(string calldata name, address from, address to) external;
}

/// @title Marketplace for Zeta Name Service
contract ZetaNameMarketplace is Ownable {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // name(lowercase) => listing
    mapping(string => Listing) public listings;

    uint256 public constant LISTING_FEE = 0.0001 ether; // 0.0001 ETH
    IZetaNameService public immutable nameService;

    event Listed(string indexed name, address indexed seller, uint256 price);
    event Unlisted(string indexed name);
    event Purchased(string indexed name, address indexed seller, address indexed buyer, uint256 price);

    constructor(address ns, address initialOwner) {
        require(ns != address(0), "NS_ZERO");
        nameService = IZetaNameService(ns);
        _transferOwnership(initialOwner);
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

    function list(string calldata name, uint256 price) external payable {
        require(msg.value == LISTING_FEE, "FEE");
        string memory n = _toLower(name);
        require(nameService.ownerOf(n) == msg.sender, "NOT_OWNER");
        require(price > 0, "BAD_PRICE");
        listings[n] = Listing({ seller: msg.sender, price: price, active: true });
        emit Listed(n, msg.sender, price);
    }

    function unlist(string calldata name) external {
        string memory n = _toLower(name);
        Listing memory l = listings[n];
        require(l.active, "NO_LIST");
        require(l.seller == msg.sender, "NOT_SELLER");
        delete listings[n];
        emit Unlisted(n);
    }

    function buy(string calldata name) external payable {
        string memory n = _toLower(name);
        Listing memory l = listings[n];
        require(l.active, "NO_LIST");
        require(msg.value == l.price, "PRICE");

        // Effect
        delete listings[n];

        // Transfer domain via NameService
        nameService.marketTransfer(n, l.seller, msg.sender);

        // Payout seller
        (bool ok, ) = payable(l.seller).call{ value: msg.value }("");
        require(ok, "PAYOUT_FAIL");

        emit Purchased(n, l.seller, msg.sender, l.price);
    }

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "BAD_TO");
        to.transfer(address(this).balance);
    }
}



