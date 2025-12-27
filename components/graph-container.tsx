// components/graph-container.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Oval } from 'react-loading-icons';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
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
    const [layoutTrigger, setLayoutTrigger] = useState(0);

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

            // Deduplicate edges: only add if neither direction exists
            const existingLinks = new Set(prev.links.map(l => `${l.source}-${l.target}`));
            const uniqueNewLinks = newLinks.filter((l: Arista) =>
                !existingLinks.has(`${l.source}-${l.target}`) &&
                !existingLinks.has(`${l.target}-${l.source}`)
            );

            return {
                nodes: [...prev.nodes, ...uniqueNewNodes],
                links: [...prev.links, ...uniqueNewLinks]
            };
        });
    };

    return (
        <>
            <div className="absolute top-0 left-0 z-10 p-5 h-full pointer-events-none">
                <div className="w-[340px] h-full overflow-y-auto pointer-events-auto pr-2 pb-10">
                    <SearchForm />
                    <ArtistCard artist={artist} />

                    {graphData && (
                        <button
                            onClick={() => setLayoutTrigger(t => t + 1)}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium transition-colors border border-white/10"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            Reordenar Grafo
                        </button>
                    )}
                </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Oval stroke="#c72f4e" strokeWidth={3} height="3em" />
                    </div>
                ) : graphData ? (
                    <GraphCard
                        key={query}
                        nodes={graphData.nodes}
                        links={graphData.links}
                        onNodeClick={handleExpandNode}
                        layoutTrigger={layoutTrigger}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">Busca un artista para empezar</div>
                )}
            </div>
        </>
    );
}