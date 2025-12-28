import { SimulationLinkDatum, SimulationNodeDatum } from "d3";

export type ArtistImage = {
    url: string;
    height: number;
    width: number;
};

export type Artist = {
    grupo: number;
    external_urls: {
        spotify: string;
    }
    id: string;
    name: string;
    images: ArtistImage[];
    genres: string[];
    popularity: number;
    followers: {
        total: number;
    };
}

export type ArtistsResponse = {
    artists: {
        items: Artist[];
        total: number;
        limit: number;
        offset: number;
    };
}

export type Album = {
    id: String
}

export type Track = {
    id: String;
    artists: Artist[];

}

export type AlbumsResponse = {
    items: Album[]
}

export type AlbumTracksResponse = {
    items: Track[];
}

export type RelatedResponse = {
    artists: Artist[];
}

export interface Nodo extends SimulationNodeDatum {
    // 3D coordinates
    z?: number;
    vz?: number;
    fz?: number;
    grupo: number;
    external_urls: {
        spotify: string;
    }
    id: string;
    name: string;
    images: ArtistImage[];
    genres: string[];
    popularity: number;
    expanded?: boolean; // Propiedad opcional para la lógica de expansión
}

export interface Arista extends SimulationLinkDatum<Nodo> {
    source: string;
    target: string;
}

export type Grafo = {
    nodes: Nodo[];
    links: Arista[];
};
