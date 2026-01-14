import { useState, useCallback } from 'react'
import { Plus, Disc, Music, Image as ImageIcon, CheckCircle2, ChevronRight, ArrowLeft, Send, Loader2, Minus, Trash2, Clock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { StepIndicator } from '../layout/UIComponents'
import { cn } from "@/lib/utils"
import { PLACEHOLDER_COVER, PLACEHOLDER_AUDIO } from '../../lib/constants'

export function StudioWizard({
    account,
    onDeploy,
    uploadToIPFS,
    uploadJSONToIPFS,
    isUploading,
    coverCID,
    resetIPFS,
    addToast,
    isDeploying
}) {
    const [wizardStep, setWizardStep] = useState(1);
    const [albumName, setAlbumName] = useState("");
    const [artistName, setArtistName] = useState("");
    const [albumPrice, setAlbumPrice] = useState("0");
    const [commercialPrice, setCommercialPrice] = useState("0.5");
    const [tracks, setTracks] = useState([{ id: Date.now(), title: "", file: null, cid: "", uploading: false }]);
    const [coverFile, setCoverFile] = useState(null);
    const [collaborators, setCollaborators] = useState([{ address: account || "", share: 100 }]);
    const [savedArtists, setSavedArtists] = useState(() => {
        const saved = localStorage.getItem("savedArtists");
        return saved ? JSON.parse(saved) : [];
    });

    const saveArtist = useCallback((address) => {
        if (!address || !address.startsWith("0x")) return;
        setSavedArtists(prev => {
            if (prev.find(a => a.address.toLowerCase() === address.toLowerCase())) return prev;
            const next = [...prev, { name: `Artist ${prev.length + 1}`, address }];
            localStorage.setItem("savedArtists", JSON.stringify(next));
            return next;
        });
        addToast("Artist address saved!", "success");
    }, [addToast]);

    const removeSavedArtist = useCallback((address) => {
        setSavedArtists(prev => {
            const next = prev.filter(a => a.address !== address);
            localStorage.setItem("savedArtists", JSON.stringify(next));
            return next;
        });
        addToast("Artist removed from saved list.", "info");
    }, [addToast]);

    const updateSplitShare = useCallback((index, newShare) => {
        const share = Math.min(100, Math.max(0, parseInt(newShare) || 0));
        setCollaborators(prev => {
            const next = prev.map(c => ({ ...c }));
            const oldShare = next[index].share;
            next[index].share = share;

            if (next.length > 1) {
                const remainingTotal = 100 - share;
                const oldRemainingTotal = 100 - oldShare;

                if (oldRemainingTotal === 0) {
                    const sharePerOther = remainingTotal / (next.length - 1);
                    next.forEach((c, i) => { if (i !== index) c.share = Math.floor(sharePerOther) });
                    const sum = next.reduce((acc, c) => acc + c.share, 0);
                    if (sum < 100) next[next.length - 1 === index ? 0 : next.length - 1].share += (100 - sum);
                } else {
                    next.forEach((c, i) => {
                        if (i !== index) {
                            c.share = Math.round(c.share * (remainingTotal / oldRemainingTotal));
                        }
                    });
                    const currentSum = next.reduce((acc, c) => acc + c.share, 0);
                    if (currentSum !== 100) {
                        const diff = 100 - currentSum;
                        let bestIdx = index === 0 ? 1 : 0;
                        for (let i = 0; i < next.length; i++) {
                            if (i !== index && next[i].share > next[bestIdx].share) bestIdx = i;
                        }
                        next[bestIdx].share += diff;
                    }
                }
            }
            return next;
        });
    }, []);

    const addCollaborator = useCallback(() => {
        setCollaborators(prev => {
            const newSplit = { address: "", share: 0 };
            const next = prev.map(c => ({ ...c }));
            next.push(newSplit);

            let largestIdx = 0;
            next.forEach((c, i) => {
                if (i < next.length - 1 && c.share > next[largestIdx].share) largestIdx = i
            });

            const takeAmount = Math.floor(next[largestIdx].share / 2);
            next[largestIdx].share -= takeAmount;
            next[next.length - 1].share = takeAmount;

            return next;
        });
    }, []);

    const addTrack = () => {
        setTracks(prev => [...prev, { id: Date.now(), title: "", file: null, cid: "", uploading: false }]);
    };

    const removeTrack = (id) => {
        if (tracks.length > 1) {
            setTracks(prev => prev.filter(t => t.id !== id));
        }
    };

    const updateTrack = (id, field, value) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleTrackUpload = async (id, file) => {
        if (!file) return;
        updateTrack(id, "uploading", true);
        const cid = await uploadToIPFS(file, "music", true); // Silent upload to get CID
        updateTrack(id, "cid", cid);
        updateTrack(id, "uploading", false);
        updateTrack(id, "file", file);
    };

    const handleDeploy = async () => {
        if (tracks.some(t => !t.cid || !t.title)) {
            addToast("All tracks must have a title and be uploaded.", "error");
            return;
        }

        addToast("Finalizing Album Metadata...", "loading");

        // 1. Generate Metadata
        const metadata = {
            version: "2.0",
            type: "album",
            name: albumName,
            artist: artistName,
            cover: coverCID,
            tracks: tracks.map(t => ({
                title: t.title,
                audio: t.cid
            }))
        };

        // 2. Upload JSON to IPFS
        const metadataCID = await uploadJSONToIPFS(metadata, `album_${albumName}`);
        if (!metadataCID) {
            addToast("Failed to secure album metadata.", "error");
            return;
        }

        // 3. Deploy Contract using Metadata CID as musicCID
        const success = await onDeploy({
            albumName,
            artistName,
            albumPrice,
            commercialPrice,
            collaborators,
            musicCID: metadataCID // Passing the JSON CID
        });

        if (success) {
            setAlbumName("");
            setArtistName("");
            setAlbumPrice("0");
            setCommercialPrice("0.5");
            setTracks([{ id: Date.now(), title: "", file: null, cid: "", uploading: false }]);
            setWizardStep(1);
        }
    };

    const allTracksReady = tracks.length > 0 && tracks.every(t => t.cid && t.title);

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            {/* Wizard Header */}
            <div className="flex flex-col items-center gap-8">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <span className="badge badge-primary">Create Release</span>
                    <h2 className="text-3xl font-bold text-white tracking-tight mt-3">Release Studio</h2>
                    <p className="text-slate-400 text-sm">Configure your metadata, assets, and distribution.</p>
                </div>

                <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <StepIndicator step={1} current={wizardStep} label="Meta" />
                    <div className={cn("w-10 h-0.5 rounded-full transition-all", wizardStep > 1 ? "bg-indigo-500" : "bg-slate-700")} />
                    <StepIndicator step={2} current={wizardStep} label="Assets" />
                    <div className={cn("w-10 h-0.5 rounded-full transition-all", wizardStep > 2 ? "bg-indigo-500" : "bg-slate-700")} />
                    <StepIndicator step={3} current={wizardStep} label="Split" />
                    <div className={cn("w-10 h-0.5 rounded-full transition-all", wizardStep > 3 ? "bg-indigo-500" : "bg-slate-700")} />
                    <StepIndicator step={4} current={wizardStep} label="Deploy" />
                </div>
            </div>

            <div className="pro-card p-8 md:p-10">
                {/* STEP 1: IDENTITY */}
                {wizardStep === 1 && (
                    <div className="space-y-8">
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Album Title</label>
                                <input
                                    placeholder="Enter album title..."
                                    className="pro-input w-full h-14 text-xl font-bold"
                                    value={albumName}
                                    onChange={(e) => setAlbumName(e.target.value)}
                                />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <div className="flex justify-between ml-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Artist Name</label>
                                    </div>
                                    <input
                                        placeholder="Your name..."
                                        className="pro-input w-full h-12"
                                        value={artistName}
                                        onChange={(e) => setArtistName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between ml-1">
                                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Price</label>
                                        <span className="text-[10px] font-medium text-slate-500">PERSONAL</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            step="0.01"
                                            className="pro-input w-full h-12 pr-14"
                                            value={albumPrice}
                                            onChange={(e) => setAlbumPrice(e.target.value)}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-indigo-400">ETH</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between ml-1">
                                        <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">License</label>
                                        <span className="text-[10px] font-medium text-amber-500">COMMERCIAL</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="0.5"
                                            step="0.01"
                                            className="pro-input w-full h-12 pr-14 border-amber-600/30 focus:border-amber-500"
                                            value={commercialPrice}
                                            onChange={(e) => setCommercialPrice(e.target.value)}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-amber-400">ETH</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setWizardStep(2)}
                            disabled={!albumName || !artistName}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex gap-2"
                        >
                            Continue <ChevronRight size={18} />
                        </Button>
                    </div>
                )}

                {/* STEP 2: MEDIA (TRACKLIST) */}
                {wizardStep === 2 && (
                    <div className="space-y-8">
                        <div className="grid gap-8 lg:grid-cols-2">
                            {/* Tracklist Hub */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tracklist</p>
                                        <p className="text-xs text-indigo-400 mt-0.5">{tracks.length} track(s)</p>
                                    </div>
                                    <Button
                                        onClick={addTrack}
                                        className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg flex gap-2"
                                    >
                                        <Plus size={14} /> Add Track
                                    </Button>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {tracks.map((track, idx) => (
                                        <div key={track.id} className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <input
                                                        placeholder="Track title..."
                                                        className="pro-input w-full h-10 text-sm"
                                                        value={track.title}
                                                        onChange={(e) => updateTrack(track.id, "title", e.target.value)}
                                                    />
                                                </div>
                                                {tracks.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-10 w-10 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                                        onClick={() => removeTrack(track.id)}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                )}
                                            </div>
                                            <div>
                                                {track.cid ? (
                                                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 bg-emerald-500 text-white rounded">
                                                                <Music size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-emerald-400">Ready</p>
                                                                <p className="text-[10px] font-mono text-emerald-500/70">CID: {track.cid.slice(0, 12)}...</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-7 px-2 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 rounded"
                                                            onClick={() => updateTrack(track.id, "cid", "")}
                                                        >
                                                            Replace
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className={cn(
                                                        "h-12 rounded-lg border border-dashed flex items-center justify-center gap-2 relative overflow-hidden",
                                                        track.uploading ? "bg-amber-500/10 border-amber-500/30" : "bg-slate-700/50 border-slate-600 hover:border-indigo-500/50"
                                                    )}>
                                                        {track.uploading ? (
                                                            <>
                                                                <Loader2 className="animate-spin text-amber-400" size={16} />
                                                                <span className="text-xs text-amber-400">Uploading...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Music className="text-slate-500" size={16} />
                                                                <span className="text-xs text-slate-500">Upload audio</span>
                                                                <input
                                                                    type="file"
                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                    accept="audio/*"
                                                                    onChange={(e) => {
                                                                        if (e.target.files?.[0]) handleTrackUpload(track.id, e.target.files[0]);
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cover Art */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cover Art</p>
                                    {coverCID && <span className="text-xs text-indigo-400 flex items-center gap-1"><CheckCircle2 size={12} /> Uploaded</span>}
                                </div>
                                <div className={cn(
                                    "aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center p-6 relative overflow-hidden",
                                    coverCID ? "bg-slate-800 border-indigo-500/30" : "bg-slate-800/50 border-slate-600 hover:border-indigo-500/50"
                                )}>
                                    {coverCID ? (
                                        <div className="text-center space-y-3">
                                            <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden">
                                                <img src={`https://ipfs.io/ipfs/${coverCID}`} className="w-full h-full object-cover" />
                                            </div>
                                            <p className="text-sm font-medium text-white">Cover Ready</p>
                                            <Button variant="outline" size="sm" onClick={() => uploadToIPFS(null, "cover")} className="border-slate-600 text-slate-400 hover:bg-slate-700 text-xs rounded-lg">Change</Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-4 bg-slate-700 rounded-xl mb-4"><ImageIcon size={32} className="text-indigo-400" /></div>
                                            <p className="font-semibold text-white">Upload Cover</p>
                                            <p className="text-xs text-slate-500 mt-1 text-center">Drag & drop<br />(4000x4000 recommended)</p>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) uploadToIPFS(e.target.files[0], "cover");
                                                }}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-slate-700">
                            <Button variant="ghost" onClick={() => setWizardStep(1)} className="h-10 px-4 font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg gap-2">
                                <ArrowLeft size={16} /> Back
                            </Button>
                            <Button
                                onClick={() => setWizardStep(3)}
                                disabled={!allTracksReady || !coverCID}
                                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex gap-2"
                            >
                                Revenue Splits <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 3: REVENUE SPLIT */}
                {wizardStep === 3 && (
                    <div className="space-y-8">
                        <div className="grid lg:grid-cols-5 gap-8">
                            {/* Split Visualizer */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Split</p>
                                                <h3 className="text-5xl font-bold text-white tabular-nums">100<span className="text-xl text-indigo-400">%</span></h3>
                                            </div>
                                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                                <CheckCircle2 size={20} className="text-emerald-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="h-3 bg-slate-700 rounded-full flex overflow-hidden gap-0.5">
                                                {collaborators.map((c, i) => (
                                                    <div
                                                        key={i}
                                                        style={{ width: `${c.share}%` }}
                                                        className={cn(
                                                            "h-full rounded-full transition-all",
                                                            i % 3 === 0 ? "bg-indigo-500" : i % 3 === 1 ? "bg-emerald-500" : "bg-sky-500"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Participants</p>
                                                    <p className="text-xl font-bold text-white">{collaborators.length}</p>
                                                </div>
                                                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Governance</p>
                                                    <p className="text-sm font-semibold text-indigo-400">Fixed Split</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Plus size={14} className="text-slate-400" />
                                        <h4 className="text-sm font-semibold text-white">Saved Artists</h4>
                                    </div>
                                    <div className="space-y-2">
                                        {savedArtists.map((a, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    const next = [...collaborators];
                                                    next[collaborators.length - 1].address = a.address;
                                                    setCollaborators(next);
                                                }}
                                                className="w-full p-3 flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 hover:border-indigo-500/50 transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-600 group-hover:bg-indigo-600 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-white font-bold text-xs transition-all">{a.name.slice(0, 1)}</div>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{a.name}</p>
                                                        <p className="text-[10px] font-mono text-slate-500">{a.address.slice(0, 10)}...</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                            </button>
                                        ))}
                                        {savedArtists.length === 0 && (
                                            <div className="py-6 text-center">
                                                <p className="text-xs text-slate-500">No saved artists yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stakeholder List */}
                            <div className="lg:col-span-3 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Stakeholders</h4>
                                    <Button
                                        onClick={addCollaborator}
                                        className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg flex gap-2"
                                    >
                                        <Plus size={14} /> Add Recipient
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {collaborators.map((col, idx) => (
                                        <div key={idx} className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex flex-col md:flex-row items-center gap-4">
                                            <div className="flex-1 w-full space-y-2">
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase">Address (0x)</p>
                                                <input
                                                    className="pro-input w-full h-11 font-mono text-sm"
                                                    placeholder="0x..."
                                                    value={col.address}
                                                    onChange={(e) => {
                                                        const next = [...collaborators];
                                                        next[idx].address = e.target.value;
                                                        setCollaborators(next);
                                                    }}
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => saveArtist(col.address)}
                                                        className="h-8 px-3 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white rounded-lg"
                                                    >
                                                        Save
                                                    </Button>
                                                    {savedArtists.find(a => a.address.toLowerCase() === col.address.toLowerCase()) && (
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => removeSavedArtist(col.address)}
                                                            className="h-8 px-3 text-[10px] font-medium text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg"
                                                        >
                                                            Remove
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-full md:w-28 space-y-2">
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase text-center md:text-left">Share %</p>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        className="pro-input w-full h-11 text-center font-bold text-lg pr-8"
                                                        value={col.share}
                                                        onChange={(e) => updateSplitShare(idx, e.target.value)}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                                                </div>
                                            </div>
                                            {collaborators.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                                    onClick={() => removeCollaborator(idx)}
                                                >
                                                    <Minus size={18} />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-slate-700">
                            <Button variant="ghost" onClick={() => setWizardStep(2)} className="h-10 px-4 font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg gap-2">
                                <ArrowLeft size={16} /> Back
                            </Button>
                            <Button
                                onClick={() => setWizardStep(4)}
                                disabled={collaborators.some(c => !c.address || c.address.length < 42)}
                                className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg flex gap-2"
                            >
                                Review & Deploy <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 4: FINAL REVIEW */}
                {wizardStep === 4 && (
                    <div className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {/* Preview Card */}
                            <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 space-y-6">
                                <div className="aspect-square relative rounded-xl overflow-hidden">
                                    <img src={`https://ipfs.io/ipfs/${coverCID || "placeholder"}`} className="w-full h-full object-cover" />
                                    <div className="absolute top-3 right-3 bg-slate-900/90 px-3 py-1.5 rounded-lg text-xs font-semibold text-white">
                                        {albumPrice} ETH
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-bold text-white">{albumName}</h3>
                                    <p className="text-sm text-slate-400">{artistName}</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-1 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Tracks</p>
                                        <p className="text-lg font-bold text-indigo-400">{tracks.length}</p>
                                    </div>
                                    <div className="flex-1 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Network</p>
                                        <p className="text-sm font-semibold text-emerald-400">BESU MAIN</p>
                                    </div>
                                </div>
                            </div>

                            {/* Deployment Prompt */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        <span className="text-xs font-semibold uppercase">Ready to Deploy</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-white">Authorize Deployment</h3>
                                    <p className="text-slate-400 leading-relaxed">By authorizing, you will mint a new royalty distributor contract and secure your master assets on IPFS indefinitely.</p>
                                </div>

                                <div className="p-6 bg-indigo-600 rounded-xl text-white space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                            <Send size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-indigo-200 uppercase mb-0.5">Blockchain Transaction</p>
                                            <p className="text-lg font-semibold">Standard Minting Gas</p>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-14 bg-white text-indigo-600 hover:bg-slate-100 text-lg font-bold rounded-xl"
                                        onClick={handleDeploy}
                                        disabled={isUploading || isDeploying}
                                    >
                                        {isUploading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="animate-spin" size={20} />
                                                <span>Uploading...</span>
                                            </div>
                                        ) : isDeploying ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="animate-spin" size={20} />
                                                <span>Deploying...</span>
                                            </div>
                                        ) : "Commit to Protocol"}
                                    </Button>
                                </div>

                                <div className="flex justify-center">
                                    <Button variant="ghost" onClick={() => setWizardStep(3)} className="text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg gap-2">
                                        <ArrowLeft size={14} /> Adjust Split
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
