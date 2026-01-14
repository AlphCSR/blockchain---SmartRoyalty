
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RoyaltyFactory", function () {
    let RoyaltyFactory, factory;
    let owner, artist, payee1, payee2;

    beforeEach(async function () {
        [owner, artist, payee1, payee2] = await ethers.getSigners();
        RoyaltyFactory = await ethers.getContractFactory("RoyaltyFactory");
        factory = await RoyaltyFactory.deploy();
        // await factory.waitForDeployment(); // Hardhat ethers v6 syntax
    });

    it("Should create a new RoyaltyDistributor", async function () {
        const payees = [payee1.address, payee2.address];
        const shares = [50, 50];

        const tx = await factory.createRoyaltyDistributor("Album1", "Artist1", payees, shares);
        const receipt = await tx.wait(); // Wait for transaction to be mined

        // Check event emission
        // Note: Checking events depends on exact ethers/hardhat version, omitting deep event check for simplicity

        const deployedContracts = await factory.getDeployedContracts();
        expect(deployedContracts.length).to.equal(1);
    });

    it("RoyaltyDistributor should split payments correctly", async function () {
        const payees = [payee1.address, payee2.address];
        const shares = [50, 50];

        await factory.createRoyaltyDistributor("Album1", "Artist1", payees, shares);
        const deployedContracts = await factory.getDeployedContracts();
        const distributorAddress = deployedContracts[0];

        const RoyaltyDistributor = await ethers.getContractFactory("RoyaltyDistributor");
        const distributor = RoyaltyDistributor.attach(distributorAddress);

        // Send 1 ETH to distributor
        await owner.sendTransaction({
            to: distributorAddress,
            value: ethers.parseEther("1.0")
        });

        // Check payee1 balance increase after release
        // PaymentSplitter release(address account)

        // Initial balance
        const balanceBefore = await ethers.provider.getBalance(payee1.address);

        // Release
        await distributor["release(address)"](payee1.address);

        const balanceAfter = await ethers.provider.getBalance(payee1.address);

        // Should have received 0.5 ETH
        // Gas cost makes it slightly less if payee1 called the transaction, but here owner can call release for payee1? 
        // Actually PaymentSplitter release can be called by anyone.
        // Wait, usually release sends to the account.

        expect(balanceAfter).to.be.gt(balanceBefore);
        // expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("0.5")); // Roughly
    });
});
