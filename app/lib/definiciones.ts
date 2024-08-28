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

export interface Nodo extends SimulationNodeDatum{//extends SimulationNodeDatum {
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

export interface Arista extends SimulationLinkDatum<Nodo>{
    source: string;
    target: string;
    value: number;
}

export type Grafo = {
    nodes: Nodo[];
    links: Arista[];
};

// export interface SimulationNode extends Nodo {
//     x: number;
//     y: number;
//     // Otras propiedades que puedas tener
// }
//
// // export interface SimulationLink extends Arista {
// //     source: string | SimulationNode;
// //     target: string | SimulationNode;
// // }
//
// export interface SimulationLink {
//     source: string | SimulationNode;
//     target: string | SimulationNode;
//     // Otras propiedades específicas de la simulación
// }
//
export type CompleteSimulationLink = Arista & SimulationLinkDatum<Nodo>;
