'use server'

import {Artist, ArtistsResponse, Grafo, Arista, Nodo, RelatedResponse} from "@/app/lib/definiciones";

async function getToken(): Promise<String> {

    const basicAuth = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        body: new URLSearchParams({
            'grant_type': 'client_credentials',
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
        },
        next: {revalidate: 3570}
    });

    const data = await response.json();
    const {access_token} = data;
    return access_token
}


export async function searchArtist(req: string): Promise<ArtistsResponse> {

    const token = await getToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${req}&type=artist`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await response.json()

}

export async function getRelated(id: string): Promise<RelatedResponse> {

    const token = await getToken();

    const response = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await response.json()
}

export async function getRelatedArtists2nds(artista: Artist): Promise<Artist[]> {

    const response = await getRelated(artista.id)
    const related_artists = response.artists

    let resultado = [artista]
    resultado = resultado.concat(related_artists)
    //     structuredClone(related_artists);
    // resultado.push(artista)
    //
    for (const arti of related_artists) {

        const resp = await getRelated(arti.id)
        const idss = resultado.map(item => item.id)
        const b = resp.artists.filter(item => {
            return !idss.includes(item.id);
        })

        resultado = resultado.concat(b)
        // resp.artists.forEach(arti => resultado.push(arti))
    }

    return resultado
}

export async function makeGrafo(artista: Artist): Promise<Grafo> {

    const response = await getRelated(artista.id)
    const artistas_grado_1 = response.artists

    artista.grupo  = 0
    artistas_grado_1.forEach(arti => {arti.grupo = 1})

    let nodos: Nodo[] = [artista] //agrego nodo artista central
    nodos = nodos.concat(artistas_grado_1) //agrego nodos de artistas de separacion 1

    let aristas: Arista[] = []
    artistas_grado_1.forEach(artista_grado_1 => {
        const arista: Arista = {source: artista.id, target: artista_grado_1.id, value: 1};
        aristas.push(arista)
    })

    for (const artista_grado_1 of artistas_grado_1) {

        const artistas_grado_2 = await getRelated(artista_grado_1.id)

        //agrego aristas para los artistas de segundo grado
        artistas_grado_2.artists.forEach(artista_grado_2 => {
            const arista: Arista = {source: artista_grado_1.id, target: artista_grado_2.id, value: 1};
            aristas.push(arista)
        })

        //agrego nodos no repetidos
        const ids = nodos.map(item => item.id)
        const no_repetidos = artistas_grado_2.artists.filter(item => {
            return !ids.includes(item.id);
        })

        no_repetidos.forEach(artista_grado_2 => {artista_grado_2.grupo = 2})
        nodos = nodos.concat(no_repetidos)

    }

    return  {
        nodes: nodos,
        links: aristas
    };

}