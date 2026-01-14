
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Simulating creation from deployer:", deployer.address);

    // Address of the factory causing issues
    const factoryAddress = "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82";
    const factory = await ethers.getContractAt("RoyaltyFactory", factoryAddress, deployer);

    // Params from user screenshot
    const albumName = "regloss";
    const artistName = "todoroki hajime";
    const payees = ["0x1F83D2639cE40B8939932c230Ce3438A08f8b63A"];
    const shares = [10];

    console.log("Parameters:", { albumName, artistName, payees, shares });

    try {
        console.log("Attempting createRoyaltyDistributor...");
        const tx = await factory.createRoyaltyDistributor(
            albumName,
            artistName,
            "ipfs://music-test",
            "ipfs://cover-test",
            payees,
            shares
        );
        console.log("Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction success! Gas used:", receipt.gasUsed.toString());

        // Find the event
        const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'RoyaltyContractCreated');
        if (event) {
            console.log("New Distributor Address:", event.args[0]);
        } else {
            console.log("Logs:", receipt.logs);
        }

    } catch (error) {
        console.error("Transaction Failed locally:", error);
        if (error.data) {
            console.error("Error Data:", error.data);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
