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

export type RelatedResponse = {
    artists: Artist[];
}

// Datos del grafo
// const nodes: Nodem[] = [
//     {
//         id: 1,
//         group: '',
//         imagen: ''
//     },
//     {
//         id: 2,
//         group: '',
//         imagen: ''
//     },
//     {
//         id: 3,
//         group: '',
//         imagen: ''
//     },
//     {
//         id: 4,
//         group: '',
//         imagen: ''
//     }
// ];
//
// const links: Linkm[] = [
//     {
//         source: 1, target: 2,
//         value: 0
//     },
//     {
//         source: 2, target: 3,
//         value: 0
//     },
//     {
//         source: 3, target: 4,
//         value: 0
//     },
//     {
//         source: 4, target: 1,
//         value: 0
//     }
// ];

export interface Nodo {//extends SimulationNodeDatum {
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

export interface Arista {//extends SimulationLinkDatum<Nodem> {
    source: string;
    target: string;
    value: number;
}

export type Grafo = {
    nodes: Nodo[];
    links: Arista[];
};
