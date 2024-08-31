'use server'

import React from 'react'
import {searchArtist, getRelated, getRelatedArtists2nds} from "@/lib/data";
import {Artist, ArtistsResponse} from "@/lib/definiciones";

export default async function ArtistRelated({query}: { query: string | undefined }) {

    if (!query) return null

    const response: ArtistsResponse = await searchArtist(query);

    if (response.artists) {
        const artista = response.artists.items[0]

        if (artista) {
          const todos = await getRelatedArtists2nds(artista)

            // todos_resultado.push(artista)

            return (
                <div>
                    <ul>
                        {/*{JSON.stringify(artistas)}*/}
                        {todos.map(artista => (<li key={artista.id}>{artista.name}</li>))}

                    </ul>
                </div>
            )
        }
    }
}
