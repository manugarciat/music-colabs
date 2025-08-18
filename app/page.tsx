// app/page.tsx
import SearchForm from "@/components/search-form";
import ArtistCard from "@/components/artist-card";
import React, {Suspense} from "react";
import GraphCard from "@/components/graph-card";
import { searchArtist, makeGrafoColabs } from "@/lib/data";
import { Nodo, Arista } from "@/lib/definiciones";

export default async function Home({ searchParams }: { searchParams: { query?: string } }) {
    const query = searchParams.query;
    let graphData: { nodes: Nodo[], links: Arista[] } | null = null;

    if (query) {
        try {
            const response = await searchArtist(query);
            if (response.artists?.items[0]) {
                const artista = response.artists.items[0];
                graphData = await makeGrafoColabs(artista);
            }
        } catch (error) {
            console.error("Failed to fetch graph data:", error);
        }
    }

    return (
        <main className="relative h-screen w-screen overflow-hidden">
            <div className="absolute top-0 left-0 z-10 p-5">
                <div className="w-[300px] bg-background/80 backdrop-blur-sm p-4 rounded-lg">
                    <SearchForm />
                    <ArtistCard query={query} />
                </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full">
                {graphData ? (
                    <Suspense fallback={<div className="text-center p-10">Cargando Grafo...</div>}>
                        <GraphCard key={query} nodes={graphData.nodes} links={graphData.links} />
                    </Suspense>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Busca un artista para empezar
                    </div>
                )}
            </div>
        </main>
    )
}