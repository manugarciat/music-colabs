// components/artist-card.tsx
'use client' // <--- Marcar como componente de cliente

import React from 'react';
import Image from "next/image";
import { Artist } from "@/lib/definiciones";

export default function ArtistCard({ artist }: { artist: Artist | null }) {
    if (!artist) {
        return null; // O un placeholder si lo prefieres
    }
    return (
        <div className="mt-10 pt-5 border rounded-sm text-card-foreground bg-card shadow-sm">
            <div className="text-4xl font-extrabold m-1 text-center"> {artist.name} </div>
            <p className="mb-3 text-xs text-center"> id: {artist.id}</p>
            {artist.images[0] && (
                 <Image src={artist.images[0].url} alt={artist.name} width={artist.images[0].width}
                           height={artist.images[0].height}/>
            )}
            <div className="m-5">
                {artist.genres.map(genero => <div key={genero}> {genero} </div>)}
            </div>
            <div className="flex justify-center mb-4">
                <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary rounded-md text-amber-50 hover:bg-primary/90 font-bold py-2 px-4 transition-colors">
                    Abrir en Spotify
                </a>
            </div>
        </div>
    )
}