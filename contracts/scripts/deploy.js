
const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    const RoyaltyFactory = await hre.ethers.getContractFactory("RoyaltyFactory");
    console.log("Deploying RoyaltyFactory...");
    const factory = await RoyaltyFactory.deploy();

    console.log("Waiting for deployment...");
    await factory.waitForDeployment();

    const address = await factory.getAddress();
    console.log("RoyaltyFactory deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
