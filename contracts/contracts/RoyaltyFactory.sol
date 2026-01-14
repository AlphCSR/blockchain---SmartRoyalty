
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoyaltyDistributor.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyFactory is Ownable {
    event RoyaltyContractCreated(address indexed contractAddress, string albumName, address indexed creator);

    RoyaltyDistributor[] public deployedContracts;

    constructor() Ownable() {}

    function createRoyaltyDistributor(
        string memory albumName,
        string memory artistName,
        string memory musicCID,
        string memory coverCID,
        uint256 albumPrice,
        uint256 commercialPrice,
        address[] memory payees,
        uint256[] memory shares_
    ) public returns (address) {
        RoyaltyDistributor newContract = new RoyaltyDistributor(
            albumName,
            artistName,
            musicCID,
            coverCID,
            albumPrice,
            commercialPrice,
            payees,
            shares_
        );

        deployedContracts.push(newContract);
        emit RoyaltyContractCreated(address(newContract), albumName, msg.sender);
        
        return address(newContract);
    }

    function getDeployedContracts() public view returns (RoyaltyDistributor[] memory) {
        return deployedContracts;
    }
}
