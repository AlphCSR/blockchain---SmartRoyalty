const hre = require("hardhat");

async function main() {
    const addr = "0xecC4cFde48EAdca2bC63E948B4378beAcE1371bf3";
    const user = "0x1F83D2639cE40B8939932c230Ce3438A08f8b63A";

    // Selectors
    // albumName(): 0x011d09d4
    // albumPrice(): 0xa503383a
    // purchasers(address): 0x6e26715b

    const provider = hre.ethers.provider;

    console.log("Checking contract at:", addr);

    try {
        const priceRes = await provider.send("eth_call", [{
            to: addr,
            data: "0xa503383a" // albumPrice()
        }, "latest"]);
        const price = hre.ethers.getBigInt(priceRes);

        console.log("Price (Wei):", price.toString());
        console.log("Price (ETH):", hre.ethers.formatEther(price));

        const boughtData = "0x6e26715b" + user.slice(2).padStart(64, '0');
        const boughtRes = await provider.send("eth_call", [{
            to: addr,
            data: boughtData
        }, "latest"]);
        const hasBought = parseInt(boughtRes, 16) === 1;

        console.log("Already purchased?", hasBought);

    } catch (err) {
        console.error("Diagnostic failed:", err.message);
    }
}

main().catch(console.error);
