import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { FACTORY_ADDRESS, BESU_CHAIN_CONFIG } from '../lib/constants';
import RoyaltyFactoryABI from '../artifacts/RoyaltyFactory.json';

export const useWallet = (addToast) => {
    const [account, setAccount] = useState(null);
    const [factoryContract, setFactoryContract] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const connectWallet = useCallback(async (silent = false) => {
        if (!window.ethereum) {
            if (!silent) addToast("Metamask not found", "error");
            return null;
        }

        setIsConnecting(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);

            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BESU_CHAIN_CONFIG.chainId }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [BESU_CHAIN_CONFIG],
                    });
                }
            }

            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            const factory = new ethers.Contract(FACTORY_ADDRESS, RoyaltyFactoryABI.abi, signer);

            setAccount(address);
            setFactoryContract(factory);
            localStorage.setItem("smartRoyaltyConnected", "true");

            if (!silent) addToast("Wallet Linked Successfully", "success");
            return { address, factory };
        } catch (error) {
            console.error("Error connecting wallet:", error);
            if (!silent) addToast("Connection Refused", "error");
            return null;
        } finally {
            setIsConnecting(false);
        }
    }, [addToast]);

    const disconnectWallet = useCallback(() => {
        setAccount(null);
        setFactoryContract(null);
        localStorage.removeItem("smartRoyaltyConnected");
        addToast("Session Cleared", "info");
    }, [addToast]);

    return {
        account,
        setAccount,
        factoryContract,
        isConnecting,
        connectWallet,
        disconnectWallet
    };
};
