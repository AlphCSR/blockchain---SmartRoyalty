import { useState, useRef, useEffect } from 'react'
import {
    X,
    Play,
    Pause,
    SkipForward,
    SkipBack,
    Volume2,
    VolumeX,
    Maximize2,
    Music,
    Disc,
    Heart,
    Share2,
    Download,
    Lock
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MasterPlayer({ album, initialTrackIndex = 0, onClose }) {
    const [metadata, setMetadata] = useState(null);
    const [currentTrackIdx, setCurrentTrackIdx] = useState(initialTrackIndex);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [loading, setLoading] = useState(true);

    const audioRef = useRef(null);

    // Fetch metadata if it's a multi-track album
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`https://ipfs.io/ipfs/${album.musicCID}`);
                const data = await res.json();
                if (data.version === "2.0") {
                    setMetadata(data);
                }
            } catch (e) {
                // Not a JSON/metadata file, single track release
                setMetadata(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [album.musicCID]);

    // Track control logic
    const tracks = metadata ? metadata.tracks : [{ title: album.name, audio: album.musicCID }];
    const currentTrack = tracks[currentTrackIdx];

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted]);

    // Handle Play/Pause and Track Changes
    useEffect(() => {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.warn("Auto-play blocked", e));
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, currentTrackIdx]);

    // Auto-play when opening or changing tracks
    useEffect(() => {
        setIsPlaying(true);
    }, [currentTrackIdx]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        const cur = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        setDuration(dur);
        setProgress((cur / dur) * 100);
    };

    const handleSeek = (e) => {
        const seekTime = (e.target.value / 100) * duration;
        audioRef.current.currentTime = seekTime;
        setProgress(e.target.value);
    };

    const nextTrack = () => {
        if (currentTrackIdx < tracks.length - 1) {
            setCurrentTrackIdx(currentTrackIdx + 1);
            setIsPlaying(false); // Reset to play new track
        }
    };

    const prevTrack = () => {
        if (currentTrackIdx > 0) {
            setCurrentTrackIdx(currentTrackIdx - 1);
            setIsPlaying(false);
        }
    };

    const formatTime = (time) => {
        if (!time) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row border border-slate-700 animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
                >
                    <X size={20} />
                </button>

                {/* Left: Artwork & Main Player */}
                <div className="flex-1 p-6 lg:p-10 flex flex-col justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <div className="space-y-8">
                        {/* Artwork */}
                        <div className="relative w-48 h-48 lg:w-72 lg:h-72 mx-auto">
                            <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl">
                                <img
                                    src={`https://ipfs.io/ipfs/${album.coverCID}`}
                                    className="w-full h-full object-cover"
                                    alt={album.name}
                                />
                            </div>
                        </div>

                        {/* Title & Artist */}
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl lg:text-3xl font-bold text-white">{currentTrack?.title}</h2>
                            <p className="text-indigo-400 font-medium text-sm">{album.artist}</p>
                        </div>

                        {/* Player Controls */}
                        <div className="space-y-4 max-w-md mx-auto">
                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    className="w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                    value={progress}
                                    onChange={handleSeek}
                                />
                                <div className="flex justify-between text-xs text-slate-500 font-mono">
                                    <span>{formatTime(audioRef.current?.currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-center gap-6">
                                <button className="text-slate-500 hover:text-red-400 transition-colors"><Heart size={20} /></button>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={prevTrack}
                                        disabled={currentTrackIdx === 0}
                                        className="text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                                    >
                                        <SkipBack size={24} fill="currentColor" />
                                    </button>
                                    <button
                                        onClick={togglePlay}
                                        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-all"
                                    >
                                        {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
                                    </button>
                                    <button
                                        onClick={nextTrack}
                                        disabled={currentTrackIdx === tracks.length - 1}
                                        className="text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                                    >
                                        <SkipForward size={24} fill="currentColor" />
                                    </button>
                                </div>
                                <button className="text-slate-500 hover:text-indigo-400 transition-colors"><Share2 size={20} /></button>
                            </div>

                            {/* Volume */}
                            <div className="flex items-center gap-3 justify-center pt-2">
                                <button onClick={() => setIsMuted(!isMuted)} className="text-slate-500 hover:text-white">
                                    {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                </button>
                                <input
                                    type="range"
                                    className="w-20 h-1 bg-slate-700 rounded-full appearance-none cursor-pointer accent-slate-400"
                                    min="0" max="1" step="0.01"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Tracklist */}
                <div className="w-full lg:w-[320px] bg-slate-800 p-6 flex flex-col border-l border-slate-700">
                    <div className="flex-1 space-y-6 overflow-hidden flex flex-col">
                        <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Album</h3>
                            <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                    <Music size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{album.name}</p>
                                    <p className="text-[10px] text-slate-500">{tracks.length} tracks</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tracks</h3>
                            <div className="flex-1 overflow-y-auto space-y-1">
                                {tracks.map((track, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCurrentTrackIdx(idx);
                                            setIsPlaying(false);
                                        }}
                                        className={cn(
                                            "w-full p-3 rounded-lg flex items-center gap-3 transition-all",
                                            currentTrackIdx === idx
                                                ? "bg-indigo-600 text-white"
                                                : "hover:bg-slate-700 text-slate-400"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                                            currentTrackIdx === idx ? "bg-white/20 text-white" : "bg-slate-700 text-slate-500"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <span className="flex-1 text-left text-sm truncate">{track.title}</span>
                                        {currentTrackIdx === idx && (
                                            <div className="flex gap-0.5 h-3 items-end">
                                                <div className="w-0.5 bg-white animate-[bounce_0.8s_infinite] h-full" />
                                                <div className="w-0.5 bg-white animate-[bounce_1.1s_infinite] h-1/2" />
                                                <div className="w-0.5 bg-white animate-[bounce_0.9s_infinite] h-3/4" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                            <Button className="w-full h-10 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg flex gap-2">
                                <Download size={16} /> Download
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Hidden Audio Engine */}
                <audio
                    ref={audioRef}
                    src={`https://ipfs.io/ipfs/${currentTrack?.audio}`}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={nextTrack}
                    className="hidden"
                />
            </div>
        </div>
    );
}
