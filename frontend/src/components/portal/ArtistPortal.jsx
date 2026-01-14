import { Wallet, Disc, DollarSign, CheckCircle2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { EmptyState } from '../layout/UIComponents'

export function ArtistPortal({ account, myRoyalties, connectWallet, claimRoyalties }) {
    const totalClaimable = myRoyalties.reduce((acc, curr) => acc + parseFloat(curr.releasable || 0), 0).toFixed(4);
    const totalReceived = myRoyalties.reduce((acc, curr) => acc + parseFloat(curr.released || 0), 0).toFixed(4);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <span className="badge badge-primary">Royalties</span>
                <h2 className="text-3xl font-bold text-white tracking-tight mt-3">Artist Portal</h2>
                <p className="text-slate-400 text-sm">Manage your revenue streams. Royalties are distributed automatically.</p>
            </div>

            {!account ? (
                <div className="pro-card p-16 flex flex-col items-center justify-center text-center">
                    <div className="p-6 bg-slate-800 rounded-2xl mb-8">
                        <Wallet size={48} className="text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Connect Wallet</h3>
                    <p className="text-slate-400 mb-8 max-w-sm text-sm">
                        Connect your wallet to view and manage your royalty earnings.
                    </p>
                    <Button
                        onClick={connectWallet}
                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg"
                    >
                        Connect Wallet
                    </Button>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Stats Hero */}
                    <div className="pro-card p-8 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="space-y-6">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pending</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-white tabular-nums">{totalClaimable}</span>
                                            <span className="text-lg font-semibold text-indigo-400">ETH</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-12 bg-slate-700" />
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Collected</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl font-bold text-emerald-400 tabular-nums">{totalReceived}</span>
                                            <span className="text-sm font-semibold text-slate-500">ETH</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Wallet</p>
                                        <p className="text-xs font-mono text-indigo-400">{account.slice(0, 14)}...</p>
                                    </div>
                                    <div className="px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                        <p className="text-[10px] font-semibold text-emerald-500 uppercase">Network</p>
                                        <p className="text-xs font-semibold text-emerald-400">Besu</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <Button
                                    className="h-12 px-8 bg-white text-slate-900 hover:bg-slate-100 font-semibold rounded-lg disabled:opacity-50"
                                    onClick={() => claimRoyalties(null)}
                                    disabled={parseFloat(totalClaimable) === 0}
                                >
                                    Sweep All
                                </Button>
                                <p className="text-[10px] text-center text-slate-500">Auto-payouts enabled</p>
                            </div>
                        </div>
                    </div>

                    {/* Streams */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                            <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                            Active Streams
                        </h3>

                        {myRoyalties.length === 0 ? (
                            <EmptyState
                                label="No Royalties"
                                sub="You have no active royalty streams. Deploy or collaborate on a release to start earning."
                                icon={<DollarSign size={48} className="text-slate-500" />}
                            />
                        ) : (
                            <div className="space-y-4">
                                {myRoyalties.map((item, i) => (
                                    <div key={i} className="pro-card p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-20 h-20 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                                            <Disc size={32} className="text-indigo-400" />
                                        </div>

                                        <div className="flex-1 min-w-0 text-center md:text-left">
                                            <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                                                <CheckCircle2 size={14} className="text-emerald-400" />
                                                <span className="text-[10px] font-semibold text-emerald-400 uppercase">Verified</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-white truncate">{item.name}</h4>
                                            <p className="text-sm text-slate-400">by <span className="text-indigo-400">{item.artist}</span></p>
                                        </div>

                                        <div className="flex gap-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                            <div className="text-center">
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase">Share</p>
                                                <p className="text-xl font-bold text-white">{item.share}<span className="text-sm text-slate-500">%</span></p>
                                            </div>
                                            <div className="w-px h-10 bg-slate-700" />
                                            <div className="text-center">
                                                <p className="text-[10px] font-semibold text-indigo-400 uppercase">Earned</p>
                                                <p className="text-xl font-bold text-indigo-400">{item.released}<span className="text-sm text-indigo-400/50"> ETH</span></p>
                                            </div>
                                            {parseFloat(item.releasable || 0) > 0 && (
                                                <>
                                                    <div className="w-px h-10 bg-slate-700" />
                                                    <div className="text-center">
                                                        <p className="text-[10px] font-semibold text-emerald-400 uppercase">Pending</p>
                                                        <p className="text-xl font-bold text-emerald-400">{item.releasable}<span className="text-sm text-emerald-400/50"> ETH</span></p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <Button
                                            onClick={() => claimRoyalties(item.address)}
                                            disabled={parseFloat(item.releasable || 0) === 0}
                                            className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-30"
                                        >
                                            {parseFloat(item.releasable || 0) === 0 ? "Distributed" : "Claim"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
