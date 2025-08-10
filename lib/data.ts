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

const sleep =
    (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// Deprecado en la API
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
        return {artists: []}; // Devuelve un objeto con un arreglo de artistas vacío
    }

    return response.json();
}

export async function getAlbums(id: string): Promise<AlbumsResponse> {

    const token = await getToken();

    const response = await fetch(`https://api.spotify.com/v1/artists/${id}/albums?limit=50`, { // Pido 50 para tener más datos
        headers: {
            Authorization: `Bearer ${token}`,
        },
        next: {revalidate: 3600}
    });

    if (!response.ok) {
        console.error(`Error en API al obtener álbumes para el artista ${id}:`, await response.text());
        return {items: []}; // Devuelve un objeto con un arreglo de items vacío
    }

    return response.json();
}

export async function getTracks(id_album: String): Promise<AlbumTracksResponse> {

    const token = await getToken();

    const response = await fetch(`https://api.spotify.com/v1/albums/${id_album}/tracks`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        next: {revalidate: 3600}
    });

    if (!response.ok) {
        console.error(`Error en API al obtener tracks para el album ${id_album}:`, await response.text());
        return {items: []}; // Devuelve un objeto con un arreglo de items vacío
    }

    return response.json();
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
    const colabsIDs = new Set<string>();
    const albumResponse = await getAlbums(artista.id);
    const albums_artista = albumResponse.items;

    const trackPromises = albums_artista.map(album => getTracks(album.id));
    const trackResponses = await Promise.all(trackPromises);

    trackResponses.forEach(tracks => {
        tracks.items.forEach(item => {
            item.artists.forEach(artist => {
                if (artist.id !== artista.id) {
                    colabsIDs.add(artist.id);
                }
            });
        });
    });

    // ¡GRAN CAMBIO AQUÍ!
    // En lugar de un bucle, hacemos una (o muy pocas) llamadas para obtener todos los artistas.
    const idArray = Array.from(colabsIDs);
    // La API tiene un límite de 50, así que lo manejamos por si acaso (aunque es raro tener >50 colabs directas)
    const allArtists = [];
    for (let i = 0; i < idArray.length; i += 50) {
        const chunk = idArray.slice(i, i + 50);
        const artists = await getArtists(chunk);
        allArtists.push(...artists);
    }

    return allArtists;
}


export async function makeGrafoColabs(artista: Artist): Promise<Grafo> {

    let g = new Graph({ directed: false });
    artista.grupo = 0;
    g.setNode(artista.id, artista);

    const colabs_grado_1 = await getColabs(artista);

    colabs_grado_1.forEach(colab => {
        colab.grupo = 1;
        g.setNode(colab.id, colab);
        g.setEdge(artista.id, colab.id);
    });

    // 3. OBTENER COLABORADORES DE SEGUNDO GRADO

    const limiteExpansion = 9;
    const colabs_a_expandir = colabs_grado_1.slice(0, limiteExpansion);

    // ¡AQUÍ ESTÁ LA MAGIA!
    // Definimos el tamaño de nuestro lote y los resultados que iremos acumulando.
    const tamanoLote = 3; // Procesaremos de 5 en 5. Puedes ajustar este número.
    const todosLosColabsDeGrado2: any[] = [];

    for (let i = 0; i < colabs_a_expandir.length; i += tamanoLote) {
        // Obtenemos el lote actual de artistas a procesar
        const lote = colabs_a_expandir.slice(i, i + tamanoLote);

        // Creamos y ejecutamos las promesas solo para este lote
        const promesasLote = lote.map(colab => getColabs(colab));
        const resultadosLote = await Promise.all(promesasLote);

        // Guardamos los resultados del lote
        todosLosColabsDeGrado2.push(...resultadosLote);

        // Imprimimos un mensaje útil y esperamos un poco antes del siguiente lote.
        console.log(`Procesado lote ${i/tamanoLote + 1}, esperando 1 segundo...`);
        await sleep(1000); // Pausa de 1 segundo (1000 ms)
    }

    // Ahora procesamos los resultados, que ya tenemos todos
    colabs_a_expandir.forEach((colab_de_grado_1, index) => {
        const sus_colaboradores = todosLosColabsDeGrado2[index];
        if (!sus_colaboradores) return; // Salvaguarda por si algo falla

        sus_colaboradores.forEach((colab_de_grado_2: { id: string; grupo: number; }) => {
            if (!g.hasNode(colab_de_grado_2.id)) {
                colab_de_grado_2.grupo = 2;
                g.setNode(colab_de_grado_2.id, colab_de_grado_2);
            }
            g.setEdge(colab_de_grado_1.id, colab_de_grado_2.id);
        });
    });

    const nodos: Nodo[] = g.nodes().map(nodeId => g.node(nodeId));
    const aristas: Arista[] = g.edges().map(edge => ({ source: edge.v, target: edge.w }));

    return {
        nodos: nodos,
        aristas: aristas
    };
}


async function getArtists(ids: string[]): Promise<Artist[]> {
    if (ids.length === 0) return [];

    const token = await getToken();
    const response = await fetch(`https://api.spotify.com/v1/artists?ids=${ids.join(',')}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        next: {revalidate: 3600}
    });

    if (!response.ok) {
        console.error(`Error en API al obtener artistas:`, await response.text());
        return []; // Devuelve un arreglo vacío
    }

    const data = await response.json();
    return data.artists || [];
}