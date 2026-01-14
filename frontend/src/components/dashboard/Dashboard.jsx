import { Disc, DollarSign, User, LayoutDashboard, Heart, Eye, RefreshCw, Zap, ArrowRight, ShoppingBag, Trophy, TrendingUp } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { StatsCard, EmptyState } from '../layout/UIComponents'
import { resolveIPFS } from '../../lib/utils'

export function Dashboard({
    distributors,
    totalVolume,
    myRoyalties,
    recentActivity,
    loading,
    fetchDistributors,
    supportArtist,
    setSelectedContract,
    setActiveTab
}) {
    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="badge badge-primary">Protocol Monitor</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Network Overview</h2>
                    <p className="text-slate-400 text-sm">Real-time transparency for the SmartRoyalty ecosystem.</p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchDistributors}
                    className="h-10 px-6 bg-slate-800 border-slate-700 text-slate-300 font-medium rounded-lg flex gap-2 hover:bg-slate-700"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                <StatsCard
                    title="Active Releases"
                    value={distributors?.length || 0}
                    trend="Protocol v1"
                    icon={<Disc size={18} />}
                />
                <StatsCard
                    title="Total Volume"
                    value={`${totalVolume || 0} ETH`}
                    trend="All Time"
                    icon={<DollarSign size={18} />}
                />
                <StatsCard
                    title="Artists"
                    value={new Set((myRoyalties || []).map(r => r.artist)).size || (distributors?.length || 0)}
                    trend="Verified"
                    icon={<User size={18} />}
                />
            </div>

            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Contract Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                        Live Contracts
                    </h3>

                    <div className="grid gap-6 md:grid-cols-2">
                        {(distributors?.length || 0) === 0 ? (
                            <EmptyState
                                label="No Contracts Yet"
                                sub="Deploy a new royalty contract to see it here."
                                action={() => setActiveTab("create")}
                                icon={<Disc size={48} className="text-slate-500" />}
                            />
                        ) : (
                            [...(distributors || [])].reverse().slice(0, 4).map((dist, i) => (
                                <div key={i} className="album-card group">
                                    <div className="h-48 relative overflow-hidden">
                                        <img
                                            src={resolveIPFS(dist.coverCID)}
                                            alt={dist.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => {
                                                e.target.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";
                                            }}
                                        />
                                        <div className="absolute top-3 left-3 bg-slate-900/80 px-2 py-1 rounded text-[10px] font-mono text-slate-400">
                                            {dist.address.slice(0, 10)}...
                                        </div>
                                    </div>

                                    <div className="p-5 space-y-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-white truncate">{dist.name}</h4>
                                            <p className="text-xs text-slate-400">
                                                by <span className="text-indigo-400">{dist.artist}</span>
                                            </p>
                                        </div>

                                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Balance</span>
                                            <div className="flex items-baseline gap-1 mt-1">
                                                <span className="text-xl font-bold text-emerald-400">{dist.balance}</span>
                                                <span className="text-xs text-slate-500">ETH</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                className="flex-1 h-9 text-xs font-medium bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg"
                                                onClick={() => setSelectedContract(dist)}
                                            >
                                                <Eye size={14} className="mr-1" /> View
                                            </Button>
                                            <Button
                                                className="w-9 h-9 bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-lg"
                                                onClick={() => supportArtist(dist.address)}
                                            >
                                                <Heart size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {(distributors?.length || 0) > 0 && (
                            <button
                                onClick={() => setActiveTab("marketplace")}
                                className="h-full min-h-[300px] rounded-xl border border-dashed border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-indigo-500/50 transition-all flex flex-col items-center justify-center gap-4 text-slate-500 hover:text-indigo-400"
                            >
                                <div className="p-4 bg-slate-800 rounded-full">
                                    <ArrowRight size={24} />
                                </div>
                                <span className="font-semibold">View All</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                        <div className="w-1 h-5 bg-amber-500 rounded-full" />
                        Recent Activity
                        <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-500">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            Live
                        </span>
                    </h3>

                    <div className="pro-card p-5 space-y-4">
                        {recentActivity.length === 0 ? (
                            <div className="py-12 text-center">
                                <Zap size={32} className="mx-auto text-slate-600 mb-3" />
                                <p className="text-xs text-slate-500">Waiting for activity...</p>
                            </div>
                        ) : (
                            recentActivity.slice(0, 5).map((activity, idx) => (
                                <div key={idx} className="flex gap-3 pb-4 border-b border-slate-700/50 last:border-0 last:pb-0">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
                                        <ShoppingBag size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-300">
                                            <span className="text-indigo-400 font-medium">{activity.buyer.slice(0, 6)}...</span> purchased
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">"{activity.albumName}"</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs font-medium text-emerald-400">+{activity.amount} ETH</span>
                                            <span className="text-[10px] text-slate-600">
                                                {(() => {
                                                    const diff = Date.now() - activity.timestamp;
                                                    const mins = Math.floor(diff / 60000);
                                                    if (mins < 1) return "Now";
                                                    if (mins < 60) return `${mins}m`;
                                                    const hrs = Math.floor(mins / 60);
                                                    if (hrs < 24) return `${hrs}h`;
                                                    return `${Math.floor(hrs / 24)}d`;
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Leaderboard */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy className="text-amber-500" size={16} />
                                <h4 className="text-sm font-semibold text-white">Top Artists</h4>
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase">By Volume</span>
                        </div>

                        <div className="space-y-2">
                            {[...(distributors || [])]
                                .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
                                .slice(0, 3)
                                .map((dist, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden">
                                            <img
                                                src={resolveIPFS(dist.coverCID)}
                                                alt={dist.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=100" }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-sm font-medium text-white truncate">{dist.name}</h5>
                                            <p className="text-[10px] text-slate-500">{dist.artist}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-indigo-400">
                                                <TrendingUp size={12} />
                                                <span className="text-sm font-bold">{dist.balance}</span>
                                            </div>
                                            <span className="text-[9px] text-slate-500">ETH</span>
                                        </div>
                                    </div>
                                ))}
                            {(distributors?.length || 0) === 0 && (
                                <div className="p-6 text-center border border-dashed border-slate-700 rounded-lg">
                                    <p className="text-xs text-slate-500">No data yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
