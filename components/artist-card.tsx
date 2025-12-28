
// components/artist-card.tsx
'use client' // <--- Marcar como componente de cliente

import React from 'react';
import Image from "next/image";
import { Artist } from "@/lib/definiciones";

interface ArtistCardProps {
    artist: Artist | null;
    expanded?: boolean;
    onToggle?: () => void;
    onRemove?: () => void;
}

export default function ArtistCard({ artist, expanded = true, onToggle, onRemove }: ArtistCardProps) {
    if (!artist) return null;

    return (
        <div className={`
bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300
            p-0 ${expanded ? '' : 'hover:bg-white/10 cursor-pointer'}
`}>
            {/* Context: If expanded, show full card. If collapsed, show mini row */}

            {expanded ? (
                // EXPANDED VIEW
                <div>
                    <div className="relative h-32 w-full">
                        {artist.images && artist.images[0] && (
                            <Image
                                src={artist.images[0].url}
                                alt={artist.name}
                                fill
                                className="object-cover opacity-60"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/50 to-transparent" />

                        {/* Header Actions */}
                        <div className="absolute top-2 right-2 z-10 flex gap-2">
                            {onRemove && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                    className="p-1.5 bg-black/40 hover:bg-red-500/80 rounded-full text-white/70 hover:text-white backdrop-blur-sm transition-colors"
                                    title="Remover del grafo"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                                </button>
                            )}
                            {onToggle && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                                    className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white/70 hover:text-white backdrop-blur-sm transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-5 -mt-8 relative z-10">
                        <h2 className="text-2xl font-bold mb-1 text-white drop-shadow-lg leading-tight">{artist.name}</h2>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {artist.genres?.slice(0, 3).map((genre) => (
                                <span key={genre} className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider bg-white/10 text-white/80 rounded-full border border-white/5">
                                    {genre}
                                </span>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                            <div>
                                <span className="text-[10px] uppercase tracking-widest text-[#1DB954] font-bold">Seguidores</span>
                                <p className="text-lg font-medium text-white/90">
                                    {artist.followers?.total?.toLocaleString() || '0'}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase tracking-widest text-[#1DB954] font-bold">Popularidad</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#1DB954] rounded-full"
                                            style={{ width: `${artist.popularity}% ` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-white/90">{artist.popularity}%</span>
                                </div>
                            </div>
                        </div>

                        <a
                            href={artist.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-6 flex items-center justify-center gap-2 w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-2.5 px-4 rounded-full transition-all text-sm uppercase tracking-wide"
                        >
                            Ver en Spotify
                        </a>
                    </div>
                </div>
            ) : (
                // COLLAPSED VIEW
                <div
                    className="flex items-center gap-3 p-3"
                    onClick={onToggle}
                >
                    {artist.images && artist.images[0] && (
                        <div className="w-10 h-10 relative rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                            <Image
                                src={artist.images[0].url}
                                alt={artist.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white/90 truncate">{artist.name}</h3>
                        <p className="text-[10px] text-white/50 uppercase tracking-wider truncate">
                            {artist.genres?.[0] || 'Artista'}
                        </p>
                    </div>
                    {onToggle && (
                        <button className="text-white/30">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}