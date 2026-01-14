
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract RoyaltyDistributor is PaymentSplitter, ReentrancyGuard {
    string public albumName;
    string public artistName;
    string public musicCID; // IPFS Hash for audio file
    string public coverCID; // IPFS Hash for cover art
    uint256 public albumPrice;
    uint256 public commercialPrice; // Price for commercial use license
    
    address[] private _allPayees;
    mapping(address => bool) public purchasers;
    mapping(address => bool) public commercialLicenses; // Tracks commercial rights

    event AlbumPurchased(address indexed buyer, uint256 amount);
    event LicensePurchased(address indexed buyer, uint256 amount);

    constructor(
        string memory _albumName,
        string memory _artistName,
        string memory _musicCID,
        string memory _coverCID,
        uint256 _albumPrice,
        uint256 _commercialPrice,
        address[] memory payees,
        uint256[] memory shares_
    ) PaymentSplitter(payees, shares_) payable {
        albumName = _albumName;
        artistName = _artistName;
        musicCID = _musicCID;
        coverCID = _coverCID;
        albumPrice = _albumPrice;
        commercialPrice = _commercialPrice;
        _allPayees = payees;
    }

    function purchaseAlbum() external payable {
        require(msg.value >= albumPrice, "Marketplace: Insufficient ETH sent");
        require(!purchasers[msg.sender], "Marketplace: Album already purchased");
        
        purchasers[msg.sender] = true;
        
        // Auto-Payout logic (Push Model)
        for (uint256 i = 0; i < _allPayees.length; i++) {
            release(payable(_allPayees[i]));
        }

        emit AlbumPurchased(msg.sender, msg.value);
    }

    function purchaseLicense() external payable {
        require(msg.value >= commercialPrice, "Marketplace: Insufficient ETH for license");
        require(!commercialLicenses[msg.sender], "Marketplace: License already acquired");
        
        commercialLicenses[msg.sender] = true;
        // Grant personal access as well if they buy the license
        if(!purchasers[msg.sender]) {
            purchasers[msg.sender] = true;
        }
        
        // Auto-Payout logic
        for (uint256 i = 0; i < _allPayees.length; i++) {
            release(payable(_allPayees[i]));
        }

        emit LicensePurchased(msg.sender, msg.value);
    }

    function hasPurchased(address _account) public view returns (bool) {
        if (albumPrice == 0) return true;
        return purchasers[_account];
    }
}
