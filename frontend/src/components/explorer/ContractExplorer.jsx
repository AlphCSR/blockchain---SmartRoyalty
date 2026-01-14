import { X, RefreshCw, Disc, User, Heart, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn, resolveIPFS } from '../../lib/utils'

export function ContractExplorer({
    selectedContract,
    setSelectedContract,
    contractEvents,
    contractPayees,
    loadingExplorer,
    supportArtist,
    fetchDistributors
}) {
    if (!selectedContract) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedContract(null)} />

            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 pb-4 flex items-start justify-between border-b border-slate-800">
                    <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center text-white overflow-hidden">
                            {selectedContract.coverCID ? (
                                <img src={resolveIPFS(selectedContract.coverCID)} className="w-full h-full object-cover" alt="Cover" />
                            ) : (
                                <Disc size={28} className="text-indigo-400" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-semibold uppercase tracking-wider">Asset</span>
                                <span className="text-[10px] font-mono text-slate-500">{selectedContract.address.slice(0, 14)}...</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">{selectedContract.name}</h3>
                            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <User size={12} className="text-indigo-400" />
                                by <span className="text-indigo-400">{selectedContract.artist}</span>
                            </p>
                        </div>
                    </div>
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" onClick={() => setSelectedContract(null)}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Stakeholders */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue Distribution</h4>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{contractPayees.length} stakeholders</span>
                        </div>
                        <div className="space-y-2">
                            {contractPayees.length === 0 ? (
                                <div className="p-6 text-center bg-slate-800/50 rounded-xl border border-slate-700">
                                    <RefreshCw className="mx-auto mb-2 text-slate-500 animate-spin" size={20} />
                                    <p className="text-xs text-slate-500">Loading stakeholders...</p>
                                </div>
                            ) : (
                                contractPayees.map((p, i) => {
                                    try {
                                        const totalS = contractPayees.reduce((acc, curr) => acc + BigInt(curr.share), 0n);
                                        const percentage = totalS > 0n ? (Number(BigInt(p.share) * 100n / totalS)) : 0;

                                        return (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white font-mono">{p.address?.slice(0, 8)}...{p.address?.slice(-6)}</p>
                                                        <p className="text-xs text-indigo-400">{percentage}% allocation</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-white">{p.share} <span className="text-xs text-slate-500">shares</span></p>
                                                </div>
                                            </div>
                                        );
                                    } catch (err) {
                                        return null;
                                    }
                                })
                            )}
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction History</h4>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{contractEvents.length} records</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden max-h-60 overflow-y-auto">
                            {contractEvents.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No ledger activity recorded yet.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-700">
                                    {contractEvents.map((event, i) => (
                                        <div key={i} className="p-4 flex justify-between items-center hover:bg-slate-800/80 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                                                    event.type === 'IN'
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                        : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                                                )}>
                                                    <ArrowLeft size={16} className={event.type === 'IN' ? "-rotate-135" : "rotate-45"} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-white">{event.label}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-slate-700/50 rounded uppercase tracking-wider">{event.type}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400">{event.details}</p>
                                                    <p className="text-[10px] font-mono text-slate-600 mt-0.5">Hash: {event.hash?.slice(0, 16)}...</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "text-sm font-black",
                                                    event.type === 'IN' ? "text-emerald-400" : "text-orange-400"
                                                )}>
                                                    {event.type === 'IN' ? "+" : "-"}{event.amount} ETH
                                                </p>
                                                <p className="text-[10px] text-slate-500">Block #{event.block}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Available Balance</p>
                        <p className="text-2xl font-bold text-white">{selectedContract.balance} <span className="text-sm text-slate-500">ETH</span></p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => supportArtist(selectedContract.address)}
                            className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium gap-2 text-white"
                        >
                            <Heart size={14} className="fill-current" /> Support (0.1 ETH)
                        </Button>
                        <Button
                            variant="outline"
                            className="h-10 px-4 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium gap-2"
                            onClick={() => fetchDistributors()}
                        >
                            <RefreshCw size={14} /> Update
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
