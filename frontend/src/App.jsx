import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { Disc, Loader2, ShoppingBag } from 'lucide-react'

// Layout & Features
import { Sidebar } from './components/layout/Sidebar'
import { Dashboard } from './components/dashboard/Dashboard'
import { StudioWizard } from './components/studio/StudioWizard'
import { ArtistPortal } from './components/portal/ArtistPortal'
import { Marketplace } from './components/marketplace/Marketplace'
import { ContractExplorer } from './components/explorer/ContractExplorer'
import { Toast } from "@/components/ui/toast"

// Lib & Hooks
import { FACTORY_ADDRESS, PLACEHOLDER_COVER, PLACEHOLDER_AUDIO } from './lib/constants'
import { useWallet } from './hooks/useWallet'
import { useIPFS } from './hooks/useIPFS'
import { useBlockchain } from './hooks/useBlockchain'

import RoyaltyDistributorABI from './artifacts/RoyaltyDistributor.json'

function App() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [toasts, setToasts] = useState([])
  const [selectedContract, setSelectedContract] = useState(null)
  const [contractEvents, setContractEvents] = useState([])
  const [contractPayees, setContractPayees] = useState([])
  const [loadingExplorer, setLoadingExplorer] = useState(false)

  const addToast = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  // --- CUSTOM HOOKS ---
  const { account, factoryContract, connectWallet, disconnectWallet } = useWallet(addToast);
  const { isUploading, musicCID, coverCID, uploadToIPFS, uploadJSONToIPFS, resetIPFS } = useIPFS(addToast);
  const {
    distributors, totalVolume, myRoyalties, recentActivity, isLoading: blockchainLoading,
    fetchDistributors, supportArtist, claimRoyalties, purchaseAlbum, purchaseLicense
  } = useBlockchain(factoryContract, account, addToast);

  // Session Management & Listeners
  useEffect(() => {
    const isConnected = localStorage.getItem("smartRoyaltyConnected")
    if (isConnected === "true") connectWallet(true)

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) connectWallet(true)
        else disconnectWallet()
      })
      window.ethereum.on('chainChanged', () => window.location.reload())
    }
  }, [connectWallet, disconnectWallet])

  // Initial Fetch
  useEffect(() => {
    if (factoryContract && account) fetchDistributors();
  }, [factoryContract, account, fetchDistributors]);

  // Fetch Events for Explorer
  useEffect(() => {
    if (!selectedContract) {
      setContractEvents([]);
      setContractPayees([]);
      return;
    }

    const fetchExplorerData = async () => {
      setLoadingExplorer(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const abi = RoyaltyDistributorABI.abi || RoyaltyDistributorABI;
        const contract = new ethers.Contract(selectedContract.address, abi, provider);

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 2000);

        const fRel = contract.filters.PaymentReleased();
        const fRec = contract.filters.PaymentReceived();
        const fAlb = contract.filters.AlbumPurchased();
        const fLic = contract.filters.LicensePurchased();

        const [rel, rec, alb, lic] = await Promise.all([
          contract.queryFilter(fRel, fromBlock).catch(() => []),
          contract.queryFilter(fRec, fromBlock).catch(() => []),
          contract.queryFilter(fAlb, fromBlock).catch(() => []),
          contract.queryFilter(fLic, fromBlock).catch(() => [])
        ]);

        const allEvents = [
          ...rel.map(e => ({ type: 'OUT', label: 'Distribution', details: `To ${e.args[0].slice(0, 6)}`, amount: ethers.formatEther(e.args[1]), hash: e.hash, block: e.blockNumber })),
          ...rec.map(e => ({ type: 'IN', label: 'Support', details: `From ${e.args[0].slice(0, 6)}`, amount: ethers.formatEther(e.args[1]), hash: e.hash, block: e.blockNumber })),
          ...alb.map(e => ({ type: 'IN', label: 'Album Sale', details: 'Music Access', amount: ethers.formatEther(e.args[1]), hash: e.hash, block: e.blockNumber })),
          ...lic.map(e => ({ type: 'IN', label: 'License', details: 'Commercial Use', amount: ethers.formatEther(e.args[1]), hash: e.hash, block: e.blockNumber }))
        ].sort((a, b) => b.block - a.block);

        setContractEvents(allEvents);

        let payeesInfo = [];
        for (let i = 0; i < 10; i++) {
          try {
            // Using staticCall is quieter in Besu/MetaMask for out-of-bounds
            const payeeAddr = await contract.payee.staticCall(i);
            const share = await contract.shares.staticCall(payeeAddr);
            payeesInfo.push({ address: payeeAddr, share: share.toString() });
          } catch (e) { break; }
        }
        setContractPayees(payeesInfo);
      } catch (error) {
        console.warn("Explorer Fetch Warning:", error.message);
      } finally {
        setLoadingExplorer(false);
      }
    };
    fetchExplorerData();
  }, [selectedContract]);

  const deployAlbum = async (data) => {
    if (!factoryContract) return false;
    try {
      const tx = await factoryContract.createRoyaltyDistributor(
        data.albumName,
        data.artistName,
        data.musicCID || musicCID || PLACEHOLDER_AUDIO,
        coverCID || PLACEHOLDER_COVER,
        ethers.parseEther(data.albumPrice || "0"),
        ethers.parseEther(data.commercialPrice || "0.5"),
        data.collaborators.map(c => c.address.trim()),
        data.collaborators.map(c => c.share),
        {
          gasLimit: 5000000,
          gasPrice: 0n
        }
      );
      addToast("Deploying to Ledger...", "loading");
      await tx.wait();
      addToast("Success! Global Distribution Active.", "success");
      fetchDistributors();
      setActiveTab("dashboard");
      resetIPFS();
      return true;
    } catch (error) {
      console.error("Deploy Error:", error);
      addToast("Deployment Failed", "error");
      return false;
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      <Sidebar
        account={account}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-10 min-h-full">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {activeTab === "dashboard" && (
              <Dashboard
                distributors={distributors}
                totalVolume={totalVolume}
                myRoyalties={myRoyalties}
                recentActivity={recentActivity}
                loading={blockchainLoading}
                fetchDistributors={fetchDistributors}
                supportArtist={supportArtist}
                setSelectedContract={setSelectedContract}
                setActiveTab={setActiveTab}
              />
            )}
            {activeTab === "marketplace" && (
              <Marketplace
                account={account}
                distributors={distributors}
                purchaseAlbum={purchaseAlbum}
                purchaseLicense={purchaseLicense}
                isLoading={blockchainLoading}
              />
            )}
            {activeTab === "create" && (
              <StudioWizard
                account={account}
                onDeploy={deployAlbum}
                uploadToIPFS={uploadToIPFS}
                uploadJSONToIPFS={uploadJSONToIPFS}
                isUploading={isUploading}
                musicCID={musicCID}
                coverCID={coverCID}
                resetIPFS={resetIPFS}
                addToast={addToast}
                isDeploying={blockchainLoading}
              />
            )}
            {activeTab === "royalties" && (
              <ArtistPortal
                account={account}
                myRoyalties={myRoyalties}
                claimRoyalties={claimRoyalties}
                connectWallet={connectWallet}
                isLoading={blockchainLoading}
              />
            )}
          </div>
        </div>
      </main>

      <ContractExplorer
        selectedContract={selectedContract}
        setSelectedContract={setSelectedContract}
        contractEvents={contractEvents}
        contractPayees={contractPayees}
        loadingExplorer={loadingExplorer}
        supportArtist={supportArtist}
        fetchDistributors={fetchDistributors}
      />

      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </div >
  )
}

export default App
