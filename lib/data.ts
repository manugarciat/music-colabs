'use server'

import {
    Artist,
    ArtistsResponse,
    Grafo,
    Arista,
    Nodo,
    RelatedResponse,
    AlbumsResponse,
    AlbumTracksResponse
} from "@/lib/definiciones";
import {Graph} from 'graphlib';

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
        next: {revalidate: 3600}
    });
    return response.json()

}

export async function getRelated(id: string): Promise<RelatedResponse> {

    const token = await getToken();

    const response = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        next: {revalidate: 3600}
    });

    if (!response.ok) {
        // Si la respuesta no es exitosa, imprime el error y devuelve un arreglo vacío.
        try {
            const error = await response.json();
            console.error("Error en la API de Spotify al obtener artistas relacionados:", error);
        } catch (e) {
            console.error("Error en la API de Spotify al obtener artistas relacionados:", response.statusText);
        }
        return { artists: [] }; // Devuelve un objeto con un arreglo de artistas vacío
    }

    return response.json();
}

export async function getAlbums(id: string): Promise<AlbumsResponse> {

    const token = await getToken();

    const response = await fetch(`https://api.spotify.com/v1/artists/${id}/albums`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        next: {revalidate: 3600}
    });
    return response.json()
}

export async function getTracks(id_album: String): Promise<AlbumTracksResponse> {

    const token = await getToken();

    const response = await fetch(`https://api.spotify.com/v1/albums/${id_album}/tracks`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        next: {revalidate: 3600}
    });
    return response.json()
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

    artista.grupo = 0
    artistas_grado_1.forEach(arti => {
        arti.grupo = 1
    })

    let nodos: Nodo[] = [artista] //agrego nodo artista central
    nodos = nodos.concat(artistas_grado_1) //agrego nodos de artistas de separacion 1

    let aristas: Arista[] = []
    artistas_grado_1.forEach(artista_grado_1 => {
        const arista: Arista = {source: artista.id, target: artista_grado_1.id};
        aristas.push(arista)
    })

    for (const artista_grado_1 of artistas_grado_1) {

        const artistas_grado_2 = await getRelated(artista_grado_1.id)

        //agrego aristas para los artistas de segundo grado
        artistas_grado_2.artists.forEach(artista_grado_2 => {
            if (artista_grado_2.id != artista.id) {
                const arista: Arista = {source: artista_grado_1.id, target: artista_grado_2.id};
                aristas.push(arista)
            }
        })

        //agrego nodos no repetidos
        const ids = nodos.map(item => item.id)
        const no_repetidos = artistas_grado_2.artists.filter(item => {
            return !ids.includes(item.id);
        })

        no_repetidos.forEach(artista_grado_2 => {
            artista_grado_2.grupo = 2
        })
        nodos = nodos.concat(no_repetidos)

    }

    return {
        nodos: nodos,
        aristas: aristas
    };

}


export async function makeGrafo2(artista: Artist): Promise<Grafo> {

    const response = await getRelated(artista.id)
    const artistas_grado_1 = response.artists

    let g = new Graph({directed: false});

    artista.grupo = 0
    g.setNode(artista.id, artista)

    artistas_grado_1.forEach(artista_grado_1 => {
        artista_grado_1.grupo = 1
        g.setNode(artista_grado_1.id, artista_grado_1)
        g.setEdge(artista.id, artista_grado_1.id)

    })

    for (const artista_grado_1 of artistas_grado_1) {

        const response = await getRelated(artista_grado_1.id)
        const artistas_grado_2 = response.artists

        //agrego aristas para los artistas de segundo grado
        for (const artista_grado_2 of artistas_grado_2) {
            if ((g.hasNode(artista_grado_2.id) && (g.node(artista_grado_2.id).grupo > 2)) || !g.hasNode(artista_grado_2.id)) {
                artista_grado_2.grupo = 2
                g.setNode(artista_grado_2.id, artista_grado_2)
            }


            g.setEdge(artista_grado_2.id, artista_grado_1.id)

            // const response = await getRelated(artista_grado_2.id)
            // const artistas_grado_3 = response.artists.slice(0, 2)
            //
            // artistas_grado_3.forEach(artista_grado_3 => {
            //     if (!g.hasNode(artista_grado_3.id)) {
            //         artista_grado_3.grupo = 3
            //         g.setNode(artista_grado_3.id, artista_grado_3)
            //     }
            //     g.setEdge(artista_grado_3.id, artista_grado_2.id)
            //
            // })

        }
    }

    const nodos: Nodo[] = g.nodes().map(node => {
        return g.node(node)
    })
    const aristas: Arista[] = g.edges().map(edge => {
        return {source: edge.v, target: edge.w}
    })
    // console.log(nodos)
    // await makeGrafoColabs(artista)

    return {
        nodos: nodos,
        aristas: aristas
    };

}

async function getArtist(id: String): Promise<Artist> {
    const token = await getToken();

    const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        next: {revalidate: 3600}
    });
    return response.json()
}

export async function getColabs(artista: Artist): Promise<Artist[]> {

    const colabsIDs = new Set<String>
    const response = await getAlbums(artista.id)
    const albums_artista = response.items

    // console.log(albums)
    for (const album of albums_artista) {
        const tracks = await getTracks(album.id);
        tracks.items.forEach(item => {
            item.artists.forEach(artist => {
                if (artist.id != artista.id) {
                    colabsIDs.add(artist.id)
                }
            })
        });
    }
    const respuesta: Artist[] = []

    //consigo las imagenes y la info completa de cada artista
    for (const id of colabsIDs) {
        const artist = await getArtist(id);
        respuesta.push(artist);
    }

    return respuesta
}


export async function makeGrafoColabs(artista: Artist): Promise<Grafo> {

    const colabs_artista = await getColabs(artista)
    let g = new Graph({directed: false});

    artista.grupo = 0
    g.setNode(artista.id, artista)

    colabs_artista.forEach(colab_grado_1 => {
        colab_grado_1.grupo = 1
        g.setNode(colab_grado_1.id, colab_grado_1)
        g.setEdge(artista.id, colab_grado_1.id)

    })

    // for (const colab_grado_1 of colabs_artista) {
    //
    //     const colabs_artista_grado2 = await getColabs(colab_grado_1)
    //
    //     //agrego aristas para los artistas de segundo grado
    //     colabs_artista_grado2.forEach(artista_grado_2 => {
    //         if (!g.hasNode(artista_grado_2.id)) {
    //             artista_grado_2.grupo = 2
    //             g.setNode(artista_grado_2.id, artista_grado_2)
    //         }
    //         g.setEdge(artista_grado_2.id, colab_grado_1.id)
    //     })
    // }

    const nodos: Nodo[] = g.nodes().map(node => {
        return g.node(node)
    })
    const aristas: Arista[] = g.edges().map(edge => {
        return {source: edge.v, target: edge.w}
    })

    return {
        nodos: nodos,
        aristas: aristas
    };

}