import React from 'react'
import {ArtistsResponse} from "@/app/lib/definiciones";
import {getRelatedArtists2nds, makeGrafo, searchArtist} from "@/app/lib/data";
import GraphComponent from "@/app/ui/grafo";

export default async function GraphCard({query}: { query: string | undefined }) {

    if (!query) return null

    const response: ArtistsResponse = await searchArtist(query);

    if (response.artists) {
        const artista = response.artists.items[0]

        if (artista) {
            const {nodes, links} = await makeGrafo(artista)

            return (
                <div>
                    <GraphComponent nodes={nodes} links={links}/>
                </div>
            )
        }
    }

}
