import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import RoyaltyDistributorABI from '../artifacts/RoyaltyDistributor.json';

export const useBlockchain = (factoryContract, account, addToast) => {
    const [distributors, setDistributors] = useState([]);
    const [totalVolume, setTotalVolume] = useState("0");
    const [myRoyalties, setMyRoyalties] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * @dev Recupera todos los contratos desplegados y sus estados actuales.
     * Calcula volúmenes, regalías acumuladas y actividad reciente.
     */
    const fetchDistributors = useCallback(async () => {
        if (!factoryContract) return;

        setIsLoading(true);
        try {
            // Obtener lista de direcciones desde la fábrica
            const deployed = await factoryContract.getDeployedContracts();
            const provider = factoryContract.runner.provider;
            let volumeAccumulator = 0n;

            const allDistributors = [];
            const matches = [];
            let globalEvents = [];

            for (const addr of (deployed || [])) {
                if (!addr || !ethers.isAddress(addr) || addr === ethers.ZeroAddress) continue;
                try {
                    const contract = new ethers.Contract(addr, RoyaltyDistributorABI.abi, provider);

                    // Consulta masiva de datos del contrato
                    const [name, artist, music, cover, price, balance, commPrice] = await Promise.all([
                        contract.albumName(),
                        contract.artistName(),
                        contract.musicCID(),
                        contract.coverCID(),
                        contract.albumPrice(),
                        provider.getBalance(addr),
                        contract.commercialPrice()
                    ]);

                    volumeAccumulator += balance;

                    // Filtros para eventos de pago y compra
                    const paymentFilter = contract.filters.PaymentReceived();
                    const albumFilter = contract.filters.AlbumPurchased();
                    const licenseFilter = contract.filters.LicensePurchased();

                    // Rango de bloques para buscar eventos (limitado para rendimiento)
                    const currentBlock = await provider.getBlockNumber();
                    const fromBlock = Math.max(0, currentBlock - 1000);

                    const [paymentEvents, albumEvents, licenseEvents] = await Promise.all([
                        contract.queryFilter(paymentFilter, fromBlock).catch(() => []),
                        contract.queryFilter(albumFilter, fromBlock).catch(() => []),
                        contract.queryFilter(licenseFilter, fromBlock).catch(() => [])
                    ]);

                    // Cálculo de ingresos históricos
                    const revenue1 = paymentEvents.reduce((acc, ev) => acc + ev.args.amount, 0n);
                    const revenue2 = albumEvents.reduce((acc, ev) => acc + ev.args.amount, 0n);
                    const revenue3 = licenseEvents.reduce((acc, ev) => acc + ev.args.amount, 0n);

                    volumeAccumulator += (revenue1 + revenue2 + revenue3);

                    // Recuperar actividad reciente para el feed global
                    let events = [];
                    try {
                        const filter = contract.filters.AlbumPurchased();
                        events = await contract.queryFilter(filter, fromBlock).catch(() => []);
                    } catch (err) {
                        console.error("Error al obtener eventos para", addr, err);
                    }

                    const mappedEvents = await Promise.all(events.map(async ev => {
                        let txTimestamp = Date.now();
                        try {
                            const block = await provider.getBlock(ev.blockNumber);
                            if (block) txTimestamp = block.timestamp * 1000;
                        } catch (e) { /* fallback a tiempo actual */ }

                        return {
                            type: 'purchase',
                            buyer: ev.args.buyer,
                            amount: ethers.formatEther(ev.args.amount),
                            albumName: name,
                            artistName: artist,
                            address: addr,
                            timestamp: txTimestamp,
                            hash: ev.transactionHash
                        };
                    }));
                    globalEvents = [...globalEvents, ...mappedEvents];

                    // Verificar permisos del usuario actual
                    let purchased = false;
                    if (account) {
                        purchased = await contract.hasPurchased(account);
                    }

                    let commercial = false;
                    try {
                        if (account) commercial = await contract.commercialLicenses(account);
                    } catch (e) { }

                    const distData = {
                        address: addr,
                        name,
                        artist,
                        musicCID: music,
                        coverCID: cover,
                        price: ethers.formatEther(price),
                        commercialPrice: commPrice ? ethers.formatEther(commPrice) : "0.5",
                        purchased,
                        commercial,
                        balance: ethers.formatEther(balance)
                    };
                    allDistributors.push(distData);

                    // Verificar si el usuario es colaborador y tiene regalías por cobrar
                    if (account) {
                        const share = await contract.shares(account);
                        if (share > 0n) {
                            const [released, releasable] = await Promise.all([
                                contract.released(account),
                                contract["releasable(address)"](account)
                            ]);
                            matches.push({
                                ...distData,
                                share: share.toString(),
                                released: ethers.formatEther(released),
                                releasable: ethers.formatEther(releasable)
                            });
                        }
                    }
                } catch (e) {
                    console.error("Error al verificar contrato:", addr, e);
                }
            }

            setDistributors(allDistributors);
            setTotalVolume(ethers.formatEther(volumeAccumulator));
            setMyRoyalties(matches);
            setRecentActivity(globalEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10));
        } catch (error) {
            console.error("Error al obtener distribuidores:", error);
        } finally {
            setIsLoading(false);
        }
    }, [factoryContract, account]);

    const purchaseAlbum = useCallback(async (contractAddress, priceInEth) => {
        if (!account) return;

        try {
            setIsLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, RoyaltyDistributorABI.abi, signer);

            const tx = await contract.purchaseAlbum({
                value: ethers.parseEther(priceInEth),
                gasLimit: 300000,
                gasPrice: 0n
            });

            addToast("Purchasing Album...", "loading");
            await tx.wait();
            addToast("Album Purchased! Support Confirmed. ✨", "success");

            await fetchDistributors();
        } catch (error) {
            console.error("Purchase failed:", error);
            addToast("Purchase Failed", "error");
        } finally {
            setIsLoading(false);
        }
    }, [account, addToast, fetchDistributors]);

    const purchaseLicense = useCallback(async (contractAddress, priceInEth) => {
        console.log("Purchase License Initiated:", contractAddress, priceInEth);
        if (!account) {
            console.warn("No account connected, aborting purchase.");
            addToast("Please connect wallet first", "warning");
            return;
        }

        try {
            setIsLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, RoyaltyDistributorABI.abi, signer);

            const tx = await contract.purchaseLicense({
                value: ethers.parseEther(String(priceInEth)),
                gasLimit: 300000,
                gasPrice: 0n
            });

            addToast("Minting Commercial License...", "loading");
            await tx.wait();
            addToast("License Acquired! PDF Generating... 📜", "success");

            await fetchDistributors();
        } catch (error) {
            console.error("License Purchase failed:", error);
            addToast("License Failed", "error");
        } finally {
            setIsLoading(false);
        }
    }, [account, addToast, fetchDistributors]);

    const supportArtist = useCallback(async (distAddress) => {
        if (!factoryContract || !account) return;

        try {
            setIsLoading(true);
            const provider = factoryContract.runner.provider;
            const signer = await provider.getSigner();

            const tx = await signer.sendTransaction({
                to: distAddress,
                value: ethers.parseEther("0.1"),
                gasLimit: 100000,
                gasPrice: 0n
            });

            addToast("Processing Contribution...", "loading");
            await tx.wait();
            addToast("Support Confirmed! ✨", "success");

            // Refresh distributors to update balances
            await fetchDistributors();
        } catch (error) {
            console.error("Support failed:", error);
            addToast("Transaction Failed", "error");
        } finally {
            setIsLoading(false);
        }
    }, [factoryContract, account, addToast, fetchDistributors]);

    const claimRoyalties = useCallback(async (contractAddress) => {
        if (!account) return;

        try {
            setIsLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // If contractAddress is null, we do a "Sweep All"
            const targets = contractAddress
                ? [contractAddress]
                : myRoyalties.filter(r => parseFloat(r.releasable) > 0).map(r => r.address);

            if (targets.length === 0) {
                addToast("Nothing to withdraw.", "info");
                return;
            }

            addToast(targets.length > 1 ? "Sweeping All Dust..." : "Withdrawing Royalties...", "loading");

            for (const targetAddr of targets) {
                const contract = new ethers.Contract(targetAddr, RoyaltyDistributorABI.abi, signer);

                // Double check it's still releasable to avoid reverts
                const releasable = await contract["releasable(address)"](account);
                if (releasable > 0n) {
                    const tx = await contract["release(address)"](account, {
                        gasLimit: 300000,
                        gasPrice: 0n
                    });
                    await tx.wait();
                }
            }

            addToast(targets.length > 1 ? "All assets swept to your wallet! ✨" : "Withdrawal Successful! ✨", "success");
            await fetchDistributors();
        } catch (error) {
            console.error("Withdraw failed:", error);
            addToast("Withdrawal Failed: Check permissions or balance", "error");
        } finally {
            setIsLoading(false);
        }
    }, [account, myRoyalties, addToast, fetchDistributors]);

    return {
        distributors,
        setDistributors,
        totalVolume,
        myRoyalties,
        recentActivity,
        isLoading,
        fetchDistributors,
        supportArtist,
        purchaseAlbum,
        purchaseLicense,
        claimRoyalties
    };
};
