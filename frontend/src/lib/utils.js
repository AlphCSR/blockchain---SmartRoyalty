import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { PINATA_GATEWAY } from './constants';

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}


export const resolveIPFS = (cid) => {
    if (!cid) return "";
    const hash = cid.replace("ipfs://", "").replace(PINATA_GATEWAY, "").trim();
    return `${PINATA_GATEWAY}${hash}`;
};

export const shortenAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatEth = (value) => {
    if (!value) return "0";
    return parseFloat(value).toFixed(4);
};
