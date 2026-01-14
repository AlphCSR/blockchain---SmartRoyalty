
const { ethers } = require("hardhat");

async function main() {
    console.log("Checking network connection...");

    // Explicitly provider from hardhat config 'besu'
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    try {
        const network = await provider.getNetwork();
        console.log(`Connected to Chain ID: ${network.chainId.toString()}`);
        console.log(`Current Block Number: ${await provider.getBlockNumber()}`);

        // Check if code exists at the suspect address of the factory
        const factoryAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const code = await provider.getCode(factoryAddr);
        console.log(`Code at ${factoryAddr}: ${code.slice(0, 50)}...`);

        if (code === "0x") {
            console.error("CRITICAL: No code found at the expected address on this network!");
        } else {
            console.log("Code found! Contract exists.");
        }

    } catch (error) {
        console.error("Connection failed:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
