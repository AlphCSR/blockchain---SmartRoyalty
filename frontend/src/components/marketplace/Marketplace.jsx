import { Play, ShoppingBag, Lock, Disc, Loader2, Search, ChevronDown, Filter, List } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { MasterPlayer } from './MasterPlayer'
import { Button } from "@/components/ui/button"
import { EmptyState } from '../layout/UIComponents'

function TracklistPreview({ musicCID, onSelectTrack }) {
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`https://ipfs.io/ipfs/${musicCID}`);
                const data = await res.json();
                if (data.version === "2.0") setMetadata(data);
            } catch (e) {
                setMetadata(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [musicCID]);

    if (loading) return <div className="h-20 flex items-center justify-center bg-slate-800 rounded-lg text-xs text-slate-500">Loading tracks...</div>;

    if (!metadata) {
        return (
            <Button
                onClick={() => onSelectTrack(0)}
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex gap-2"
            >
                <Play size={16} fill="currentColor" /> Play Track
            </Button>
        );
    }

    return (
        <div className="space-y-2">
            {metadata.tracks.slice(0, 3).map((track, idx) => (
                <button
                    key={idx}
                    onClick={() => onSelectTrack(idx)}
                    className="w-full p-3 rounded-lg flex items-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 transition-all group"
                >
                    <div className="w-6 h-6 bg-slate-700 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white rounded flex items-center justify-center text-xs font-bold transition-all">
                        {idx + 1}
                    </div>
                    <span className="text-sm text-slate-300 truncate flex-1 text-left">{track.title}</span>
                    <Play size={12} className="text-slate-500 group-hover:text-indigo-400" fill="currentColor" />
                </button>
            ))}
            {metadata.tracks.length > 3 && (
                <button
                    onClick={() => onSelectTrack(0)}
                    className="w-full py-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
                >
                    + {metadata.tracks.length - 3} more tracks
                </button>
            )}
        </div>
    );
}

export function Marketplace({ account, distributors, purchaseAlbum, purchaseLicense, isLoading }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [selectedTrackIdx, setSelectedTrackIdx] = useState(0);

    const filteredAndSorted = useMemo(() => {
        let result = [...distributors];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(d =>
                d.name.toLowerCase().includes(query) ||
                d.artist.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            if (sortBy === "price_low") return parseFloat(a.price) - parseFloat(b.price);
            if (sortBy === "price_high") return parseFloat(b.price) - parseFloat(a.price);
            return 0;
        });

        if (sortBy === "newest") return result.reverse();
        return result;
    }, [distributors, searchQuery, sortBy]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <span className="badge badge-primary">Marketplace</span>
                    <h2 className="text-3xl font-bold text-white tracking-tight mt-3">Discover Music</h2>
                    <p className="text-slate-400 text-sm">Support artists directly and unlock exclusive recordings.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pro-input w-full h-10 pl-10 pr-4 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="relative sm:w-44">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <select
                            className="pro-input w-full h-10 pl-10 pr-8 text-sm appearance-none cursor-pointer"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Newest</option>
                            <option value="price_low">Price: Low</option>
                            <option value="price_high">Price: High</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                    </div>
                </div>
            </div>

            {filteredAndSorted.length === 0 ? (
                <EmptyState
                    label={searchQuery ? "No results" : "No releases yet"}
                    sub={searchQuery ? "Try a different search." : "Be the first to release on the protocol."}
                    icon={<Disc size={48} className="text-slate-500" />}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredAndSorted.map((album, i) => (
                        <div key={i} className="album-card group">
                            <div className="aspect-square relative overflow-hidden">
                                <img
                                    src={`https://ipfs.io/ipfs/${album.coverCID}`}
                                    alt={album.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(e) => {
                                        e.target.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=1000&auto=format&fit=crop";
                                    }}
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                    {album.purchased ? (
                                        <div className="w-16 h-16 bg-indigo-600 rounded-full text-white flex items-center justify-center scale-75 group-hover:scale-100 transition-transform">
                                            <Play size={28} fill="currentColor" className="ml-1" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 bg-slate-800/80 rounded-full text-slate-400 flex items-center justify-center border border-slate-600">
                                            <Lock size={24} />
                                        </div>
                                    )}
                                </div>

                                {/* Price Tag */}
                                <div className="absolute top-3 right-3 bg-slate-900/90 px-3 py-1.5 rounded-lg text-xs font-semibold text-white">
                                    {album.price === "0.0" ? "FREE" : `${album.price} ETH`}
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white truncate">{album.name}</h3>
                                    <p className="text-xs text-slate-400">
                                        by <span className="text-indigo-400">{album.artist}</span>
                                    </p>
                                </div>

                                {album.purchased ? (
                                    <TracklistPreview
                                        musicCID={album.musicCID}
                                        onSelectTrack={(idx) => {
                                            setSelectedAlbum(album);
                                            setSelectedTrackIdx(idx);
                                        }}
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <List size={14} className="text-slate-500" />
                                                <span className="text-xs text-slate-400">Full Access</span>
                                            </div>
                                            <span className="text-[10px] text-indigo-400 font-medium">LP</span>
                                        </div>

                                        <Button
                                            onClick={() => purchaseAlbum(album.address, album.price)}
                                            disabled={isLoading}
                                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex gap-2"
                                        >
                                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                                                <>
                                                    <ShoppingBag size={16} />
                                                    <span>Purchase</span>
                                                </>
                                            )}
                                        </Button>

                                        {album.commercialPrice && album.commercialPrice !== "0.0" && (
                                            <Button
                                                onClick={() => purchaseLicense(album.address, album.commercialPrice)}
                                                disabled={isLoading || album.commercial}
                                                variant="outline"
                                                className="w-full h-10 border-amber-600/30 text-amber-400 hover:bg-amber-600/10 font-medium rounded-lg flex gap-2 text-sm"
                                            >
                                                {album.commercial ? (
                                                    <span className="text-emerald-400 flex items-center gap-2">
                                                        <Lock size={12} /> Licensed
                                                    </span>
                                                ) : (
                                                    <>
                                                        <span className="text-amber-500 bg-amber-500/20 px-1.5 rounded text-[10px]">{album.commercialPrice} ETH</span>
                                                        Commercial
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Player Modal */}
            {selectedAlbum && (
                <MasterPlayer
                    album={selectedAlbum}
                    initialTrackIndex={selectedTrackIdx}
                    onClose={() => setSelectedAlbum(null)}
                />
            )}
        </div>
    );
}
