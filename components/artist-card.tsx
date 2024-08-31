'use server'

import React from 'react'
import Image from "next/image";
import {Artist, ArtistsResponse} from "@/lib/definiciones";
import {searchArtist} from "@/lib/data";

export default async function ArtistCard({query}: { query: string | undefined }) {

    if (query) {
        const response: ArtistsResponse = await searchArtist(query);

        if (response.artists) {

            const artista = response.artists.items[0]
            return (
                <div className="mt-10 pt-5 border rounded-sm text-card-foreground bg-card shadow-sm">
                    <div className="text-4xl font-extrabold m-1 text-center"> {artista?.name} </div>
                    <p className="mb-3 text-xs text-center"> id: {artista!.id}</p>
                    <Image src={artista!.images[0].url} alt="hola" width={artista?.images[0].width}
                           height={artista?.images[0].height} />
                    <div className="m-5">

                        {artista.genres.map(genero => <div key={genero} > {genero} </div>)}
                    </div>
                </div>
            )
        } else {
            return <div>Artista no encontrado</div>;
        }

    } else {
        return <div> </div>;
    }
}
