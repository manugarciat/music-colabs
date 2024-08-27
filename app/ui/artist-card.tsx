'use server'

import React from 'react'
import Image from "next/image";
import {Artist, ArtistsResponse} from "@/app/lib/definiciones";
import {searchArtist} from "@/app/lib/data";

export default async function ArtistCard({query}: { query: string | undefined }) {

    if (query) {
        const response: ArtistsResponse = await searchArtist(query);

        if (response.artists) {

            const artista = response.artists.items[0]
            return (
                <div className="mt-10">
                    <div className="text-4xl font-extrabold m-1 text-center"> {artista?.name} </div>
                    <p className="mb-3 text-xs text-center text-[#aaaaaa]"> id: {artista!.id}</p>
                    <Image src={artista!.images[0].url} alt="hola" width={artista?.images[0].width}
                           height={artista?.images[0].height} className="rounded-sm"/>
                    <div className="m-5">

                        {artista.genres.map(genero => <div key={genero} className="text-[#aaaaaa]"> {genero} </div>)}
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
