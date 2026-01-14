
const { ethers } = require("hardhat");

//node_modules\.bin\hardhat.cmd run scripts\fundUser.js --network besu

async function main() {
    // This uses the 'besu' network account defined in hardhat.config.js
    const [deployer] = await ethers.getSigners();

    // The user's address from the screenshot
    // const userAddress = "0xab52bf5589d3a895cdce4822d20840486f5c713e";
    // const userAddress = "0x1F83D2639cE40B8939932c230Ce3438A08f8b63A";
    const userAddress = "0x147147FaEeBAb07AEA9F2Be2B44b582B34738633";

    console.log(`Funding ${userAddress} from ${deployer.address}...`);
    console.log(`Deployer Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);

    const tx = await deployer.sendTransaction({
        to: userAddress,
        value: ethers.parseEther("1000.0")
    });

    console.log(`Transaction hash: ${tx.hash}`);
    await tx.wait();

    console.log("Transaction confirmed!");
    console.log(`New User Balance: ${ethers.formatEther(await ethers.provider.getBalance(userAddress))} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
