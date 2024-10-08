import {SimulationLinkDatum, SimulationNodeDatum} from "d3";

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
}

export type ArtistsResponse = {
    artists: {
        items: Artist[];
        total: number;
        limit: number;
        offset: number;
    };
}

export type AlbumsResponse = {
    items: {
        id: String;
    };
}

export type RelatedResponse = {
    artists: Artist[];
}

export interface Nodo extends SimulationNodeDatum {//extends SimulationNodeDatum {
    grupo: number;
    external_urls: {
        spotify: string;
    }
    id: string;
    name: string;
    images: ArtistImage[];
    genres: string[];
    popularity: number;
}

export interface Arista extends SimulationLinkDatum<Nodo> {
    source: string;
    target: string;
    value: number;
}

export type Grafo = {
    nodes: Nodo[];
    links: Arista[];
};


