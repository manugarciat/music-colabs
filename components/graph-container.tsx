// components/graph-container.tsx
'use client'

import React, { useState, useEffect } from 'react';
import SearchForm from "@/components/search-form";
import ArtistCard from "@/components/artist-card";
import GraphCard from "@/components/graph-card";
import { Nodo, Arista, Artist } from "@/lib/definiciones";

// Props que recibe del Server Component
interface GraphContainerProps {
    initialArtist: Artist | null;
    initialGraphData: { nodes: Nodo[], links: Arista[] } | null;
    query: string | undefined;
}

export default function GraphContainer({ initialArtist, initialGraphData, query }: GraphContainerProps) {

    // --- Estado local para gestionar la UI ---
    const [artist, setArtist] = useState<Artist | null>(initialArtist);
    const [graphData, setGraphData] = useState<{ nodes: Nodo[], links: Arista[] } | null>(initialGraphData);
    const [isLoading, setIsLoading] = useState(false);

    // Sincronizar el estado si la búsqueda cambia (cuando Next.js navega)
    useEffect(() => {
        setArtist(initialArtist);
        setGraphData(initialGraphData);
    }, [initialArtist, initialGraphData]);

    // --- Lógica de expansión, ahora vive aquí ---
    const handleExpandNode = async (nodeId: string) => {
        setGraphData(prev => {
            if (!prev) return null;
            return { ...prev, nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, expanded: true } : n) };
        });

        // Hacemos un 'fetch' a nuestra propia API Route, que es la forma correcta
        // de obtener datos desde un Componente de Cliente.
        const response = await fetch(`/api/collabs/${nodeId}`);
        const { newNodes, newLinks } = await response.json();

        setGraphData(prev => {
            if (!prev) return null;
            const existingNodeIds = new Set(prev.nodes.map(n => n.id));
            const uniqueNewNodes = newNodes.filter((n: Nodo) => !existingNodeIds.has(n.id));
            return {
                nodes: [...prev.nodes, ...uniqueNewNodes],
                links: [...prev.links, ...newLinks]
            };
        });
    };

    return (
        <>
            <div className="absolute top-0 left-0 z-10 p-5">
                <div className="w-[300px] bg-background/80 backdrop-blur-sm p-4 rounded-lg">
                    <SearchForm />
                    <ArtistCard artist={artist} />
                </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">Cargando...</div>
                ) : graphData ? (
                    <GraphCard
                        key={query}
                        nodes={graphData.nodes}
                        links={graphData.links}
                        onNodeClick={handleExpandNode}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">Busca un artista para empezar</div>
                )}
            </div>
        </>
    );
}