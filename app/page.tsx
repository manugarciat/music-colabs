// app/page.tsx
// --- ELIMINAR 'use client' ---

import SearchForm from "@/components/search-form";
import React from 'react';
import { searchArtist, makeGrafoColabs } from "@/lib/data";
import { Nodo, Arista, Artist } from "@/lib/definiciones";
// --- NUEVO: Importar nuestro nuevo contenedor de cliente ---
import GraphContainer from "@/components/graph-container";

export default async function Home({ searchParams }: { searchParams: { query?: string } }) {
    const query = searchParams.query;

    // --- Obtener los datos iniciales aquí, en el servidor ---
    let initialArtist: Artist | null = null;
    let initialGraphData: { nodes: Nodo[], links: Arista[] } | null = null;

    if (query) {
        try {
            const response = await searchArtist(query);
            if (response.artists?.items[0]) {
                const artist = response.artists.items[0];
                initialArtist = artist;
                initialGraphData = await makeGrafoColabs(artist);
            }
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        }
    }

    return (
        <main className="relative h-screen w-screen overflow-hidden">
            {/* --- Renderizar el CONTENEDOR DE CLIENTE y pasarle los datos iniciales --- */}
            <GraphContainer
                initialArtist={initialArtist}
                initialGraphData={initialGraphData}
                query={query}
            />
        </main>
    );
}