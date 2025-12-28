'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Nodo } from '@/lib/definiciones';

interface CollabPanelProps {
    source: Nodo;
    target: Nodo;
    tracks: any[];
    onClose: () => void;
}

export default function CollabPanel({ source, target, tracks, onClose }: CollabPanelProps) {
    const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

    // Auto-play first track when collab changes
    useEffect(() => {
        if (tracks && tracks.length > 0) {
            setPlayingTrackId(tracks[0].id);
        } else {
            setPlayingTrackId(null);
        }
    }, [source.id, target.id]);

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl animate-in slide-in-from-left-4 duration-300">
            {/* Header: Artists */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                        {source.images?.[1] && (
                            <div className="w-10 h-10 relative rounded-full overflow-hidden border-2 border-[#18181b] z-10">
                                <Image src={source.images[1].url} alt={source.name} fill className="object-cover" />
                            </div>
                        )}
                        {target.images?.[1] && (
                            <div className="w-10 h-10 relative rounded-full overflow-hidden border-2 border-[#18181b] z-0">
                                <Image src={target.images[1].url} alt={target.name} fill className="object-cover" />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-tight">{source.name}</span>
                        <span className="text-xs text-white/50">&</span>
                        <span className="text-sm font-bold leading-tight">{target.name}</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
            </div>

            {/* Active Player */}
            {playingTrackId && (
                <div className="rounded overflow-hidden shadow-lg border border-white/10 bg-black">
                    <iframe
                        src={`https://open.spotify.com/embed/track/${playingTrackId}?utm_source=generator&theme=0&autoplay=1`}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                    ></iframe>
                </div>
            )}

            {/* Track List */}
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {tracks.map((track: any) => (
                    <div
                        key={track.id}
                        className={`group flex items-center gap-3 p-2 rounded-xl transition-colors ${playingTrackId === track.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                        {/* Play Button */}
                        <button
                            onClick={() => setPlayingTrackId(track.id)}
                            className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${playingTrackId === track.id ? 'text-[#1DB954] bg-[#1DB954]/20' : 'text-white/70 hover:text-[#1DB954] hover:bg-[#1DB954]/20'}`}
                            title="Reproducir"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={playingTrackId === track.id ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 ml-0.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </button>

                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${playingTrackId === track.id ? 'text-[#1DB954]' : 'text-white/90 group-hover:text-white'}`}>
                                {track.name}
                            </p>
                        </div>

                        {/* Spotify Link */}
                        <a
                            href={track.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-[#1DB954] p-1"
                            title="Abrir en Spotify"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
