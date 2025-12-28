// app/page.tsx
// --- ELIMINAR 'use client' ---

import SearchForm from "@/components/search-form";
import React from 'react';
import { searchArtist, makeGrafoColabs, getArtist } from "@/lib/data";
import { Nodo, Arista, Artist } from "@/lib/definiciones";
// --- NUEVO: Importar nuestro nuevo contenedor de cliente ---
import GraphContainer from "@/components/graph-container";

export default async function Home(props: { searchParams: Promise<{ query?: string, id?: string }> }) {
    const searchParams = await props.searchParams;
    const query = searchParams.query;
    const id = searchParams.id;

    // --- Obtener los datos iniciales aquí, en el servidor ---
    let initialArtist: Artist | null = null;
    let initialGraphData: { nodes: Nodo[], links: Arista[] } | null = null;

    try {
        if (id) {
            const artist = await getArtist(id);
            if (artist && artist.id) {
                initialArtist = artist;
                initialGraphData = await makeGrafoColabs(artist);
            }
        } else if (query) {
            const response = await searchArtist(query);
            if (response.artists?.items[0]) {
                const artist = response.artists.items[0];
                initialArtist = artist;
                initialGraphData = await makeGrafoColabs(artist);
            }
        }
    } catch (error) {
        console.error("Failed to fetch initial data:", error);
    }

    return (
        <main className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-[#121212] via-[#1e1e24] to-[#2a2a35] text-white">
            {/* --- Renderizar el CONTENEDOR DE CLIENTE y pasarle los datos iniciales --- */}
            <GraphContainer
                initialArtist={initialArtist}
                initialGraphData={initialGraphData}
                query={query}
            />
        </main>
    );
}