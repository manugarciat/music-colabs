import {ArtistsResponse} from "@/lib/definiciones";
import {makeGrafoColabs, searchArtist} from "@/lib/data";
import GraphComponent from "@/components/grafo";

export default async function RelatedGraph({query}: { query: string | undefined }) {

    if (!query) return null

    const response: ArtistsResponse = await searchArtist(query);


    if (response.artists) {
        const artista = response.artists.items[0]

        if (artista) {
            // const grafo_colabs = await makeGrafo2(artista)
            const grafo_colabs = await makeGrafoColabs(artista)

            return (
                <>
                    <GraphComponent nodes={grafo_colabs.nodes} links={grafo_colabs.links}/>
                </>
            )
        }
    }
}
