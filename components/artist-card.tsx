// components/artist-card.tsx
'use client' // <--- Marcar como componente de cliente

import React from 'react';
import Image from "next/image";
import { Artist } from "@/lib/definiciones";

export default function ArtistCard({ artist }: { artist: Artist | null }) {
    if (!artist) {
        return null;
    }
    return (
        <div className="mt-4 p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-white">
            <div className="flex flex-col items-center">
                {artist.images && artist.images.length > 0 && (
                    <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
                        <Image
                            src={artist.images[0].url}
                            alt={artist.name}
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                        />
                    </div>
                )}
                <h2 className="text-2xl font-bold mb-1 text-center">{artist.name}</h2>
                <p className="text-xs uppercase tracking-widest opacity-70 mb-4 font-medium">
                    ID: {artist.id}
                </p>

                <div className="flex items-center gap-4 mb-4 w-full justify-center">
                    <div className="text-center">
                        <p className="text-xs text-white/50 uppercase tracking-wider">Seguidores</p>
                        <p className="font-bold text-lg">{artist.followers?.total?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="text-center">
                        <p className="text-xs text-white/50 uppercase tracking-wider">Popularidad</p>
                        <div className="flex items-center gap-2 justify-center">
                            <p className="font-bold text-lg">{artist.popularity}%</p>
                        </div>
                    </div>
                </div>

                <div className="w-full flex flex-wrap gap-2 justify-center mb-6">
                    {artist.genres?.slice(0, 4).map((genre) => (
                        <span
                            key={genre}
                            className="px-3 py-1 text-xs rounded-full bg-white/10 border border-white/10 backdrop-blur-sm"
                        >
                            {genre}
                        </span>
                    ))}
                </div>

                <a
                    href={artist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                >
                    <span>Abrir en Spotify</span>
                </a>
            </div>
        </div>
    )
}