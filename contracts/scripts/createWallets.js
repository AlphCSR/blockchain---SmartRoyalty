
const { ethers } = require("hardhat");

async function main() {
    console.log("Generating 5 Test Wallets...");
    console.log("------------------------------------------------");

    for (let i = 0; i < 5; i++) {
        const wallet = ethers.Wallet.createRandom();
        console.log(`Wallet #${i + 1}`);
        console.log(`Address: ${wallet.address}`);
        console.log(`Private Key: ${wallet.privateKey}`);
        console.log("------------------------------------------------");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
