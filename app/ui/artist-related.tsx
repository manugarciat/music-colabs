import React from 'react'
import {getRelated} from "@/app/lib/data";

export default async function ArtistRelated({id}: { id: string | undefined }) {

    if (!id) return null

    const response = await getRelated(id)
    const artistas = response.artists

    return (
        <div>
            <ul>
                {/*{JSON.stringify(artistas)}*/}
                {artistas.map(artista => (<li key={artista.id}>{artista.name}</li>))}

            </ul>
        </div>
    )
}
