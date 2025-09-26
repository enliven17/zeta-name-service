// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Zeta Name Service (.zeta)
/// @notice Minimal name registry for username.zeta with fixed 1-year terms
contract ZetaNameService is Ownable {
    struct DomainRecord {
        address owner;
        uint64 expiresAt;
    }

    // name (lowercase) => record
    mapping(string => DomainRecord) private nameToRecord;

    // price is in smallest unit of chain native token (ETH on Arbitrum Sepolia)
    uint256 public constant REGISTRATION_PRICE = 0.001 ether; // 0.001 ETH
    uint256 public constant TRANSFER_FEE = 0.0001 ether; // 0.0001 ETH
    uint256 public constant REGISTRATION_DURATION = 365 days;

    event Registered(string indexed name, address indexed owner, uint256 expiresAt);
    event Renewed(string indexed name, uint256 newExpiresAt);
    event Transferred(string indexed name, address indexed from, address indexed to);
    event MarketplaceUpdated(address marketplace);

    address public marketplace;

    constructor(address initialOwner) {
        _transferOwnership(initialOwner);
    }

    function setMarketplace(address m) external onlyOwner {
        marketplace = m;
        emit MarketplaceUpdated(m);
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

    function register(string calldata name) external payable {
        require(msg.value == REGISTRATION_PRICE, "PRICE");
        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == address(0) || _isExpired(rec), "TAKEN");

        uint64 newExpiry = uint64(block.timestamp + REGISTRATION_DURATION);
        nameToRecord[n] = DomainRecord({owner: msg.sender, expiresAt: newExpiry});

        emit Registered(n, msg.sender, newExpiry);
    }

    function renew(string calldata name) external payable {
        require(msg.value == REGISTRATION_PRICE, "PRICE");
        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == msg.sender, "NOT_OWNER");
        require(!_isExpired(rec), "EXPIRED");

        uint64 newExpiry = rec.expiresAt + uint64(REGISTRATION_DURATION);
        nameToRecord[n].expiresAt = newExpiry;
        emit Renewed(n, newExpiry);
    }

    function transfer(string calldata name, address to) external payable {
        require(msg.value == TRANSFER_FEE, "FEE");
        require(to != address(0), "BAD_TO");
        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == msg.sender, "NOT_OWNER");
        require(!_isExpired(rec), "EXPIRED");

        nameToRecord[n].owner = to;
        emit Transferred(n, msg.sender, to);
    }

    // Transfer callable by marketplace contract during a sale
    function marketTransfer(string calldata name, address from, address to) external {
        require(msg.sender == marketplace, "ONLY_MKT");
        require(to != address(0) && from != address(0), "BAD_ADDR");
        string memory n = _toLower(name);
        DomainRecord memory rec = nameToRecord[n];
        require(rec.owner == from, "NOT_OWNER");
        require(!_isExpired(rec), "EXPIRED");
        nameToRecord[n].owner = to;
        emit Transferred(n, from, to);
    }

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "BAD_TO");
        to.transfer(address(this).balance);
    }
}



