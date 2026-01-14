import { useState, useCallback } from 'react';

export const useIPFS = (addToast) => {
    const [isUploading, setIsUploading] = useState(false);
    const [musicCID, setMusicCID] = useState("");
    const [coverCID, setCoverCID] = useState("");

    const uploadToIPFS = useCallback(async (file, type, silent = false) => {
        if (!import.meta.env.VITE_PINATA_JWT) {
            addToast("IPFS Config Missing: Check your .env file", "error");
            return null;
        }

        setIsUploading(true);
        if (!silent) addToast(`Encrypting & Uploading ${type}...`, "loading");

        const formData = new FormData();
        formData.append('file', file);

        const metadata = JSON.stringify({
            name: `${type}_${Date.now()}`,
        });
        formData.append('pinataMetadata', metadata);

        const options = JSON.stringify({
            cidVersion: 0,
        });
        formData.append('pinataOptions', options);

        try {
            const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
                },
                body: formData
            });

            if (!res.ok) throw new Error("Pinata request failed");

            const resData = await res.json();
            const cid = resData.IpfsHash;

            if (!silent) {
                if (type === "music") setMusicCID(cid);
                if (type === "cover") setCoverCID(cid);
                addToast(`${type} successfully secured on IPFS!`, "success");
            }

            return cid;
        } catch (error) {
            console.error("IPFS Error:", error);
            if (!silent) addToast("IPFS Upload Failed: " + error.message, "error");
            return null;
        } finally {
            setIsUploading(false);
        }
    }, [addToast]);

    const uploadJSONToIPFS = useCallback(async (data, name) => {
        if (!import.meta.env.VITE_PINATA_JWT) return null;

        setIsUploading(true);
        try {
            const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`
                },
                body: JSON.stringify({
                    pinataContent: data,
                    pinataMetadata: { name }
                })
            });

            if (!res.ok) throw new Error("JSON pinning failed");
            const resData = await res.json();
            return resData.IpfsHash;
        } catch (error) {
            console.error("IPFS JSON Error:", error);
            return null;
        } finally {
            setIsUploading(false);
        }
    }, []);

    const resetIPFS = useCallback(() => {
        setMusicCID("");
        setCoverCID("");
    }, []);

    return {
        isUploading,
        musicCID,
        setMusicCID,
        coverCID,
        setCoverCID,
        uploadToIPFS,
        uploadJSONToIPFS,
        resetIPFS
    };
};
