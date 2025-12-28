// components/graph-container.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Oval } from 'react-loading-icons';
import DebouncedSearch from "@/components/debounced-search";
import ArtistCard from "@/components/artist-card";
import GraphCard from "@/components/graph-card";
import CollabPanel from "@/components/collab-panel";
import HelpPanel from "@/components/help-panel";
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

    // --- Estado para el panel de colaboraciones ---
    const [selectedCollab, setSelectedCollab] = useState<Arista | null>(null);

    const handleLinkClick = (link: Arista) => {
        if (link.tracks && link.tracks.length > 0) {
            setSelectedCollab(link);
        }
    }

    // Helper to get ID whether source/target is string or object (d3 mutation)
    const getID = (val: string | Nodo) => (typeof val === 'object' ? val.id : val);

    return (
        <>
            <div className="absolute top-0 left-0 z-10 p-5 h-full pointer-events-none flex flex-col justify-between">
                {/* Top Section: Search & Artist Card */}
                <div className="w-[340px] max-h-[60%] overflow-y-auto pointer-events-auto custom-scrollbar">
                    <DebouncedSearch />
                    <ArtistCard artist={artist} />
                </div>

                {/* Bottom Section: Collab Panel */}
                <div className="pointer-events-auto mt-4">
                    {selectedCollab && graphData && (() => {
                        const sID = getID(selectedCollab.source as any);
                        const tID = getID(selectedCollab.target as any);
                        const sNode = graphData.nodes.find(n => n.id === sID);
                        const tNode = graphData.nodes.find(n => n.id === tID);

                        if (sNode && tNode) {
                            return (
                                <CollabPanel
                                    source={sNode}
                                    target={tNode}
                                    tracks={selectedCollab.tracks || []}
                                    onClose={() => setSelectedCollab(null)}
                                />
                            );
                        }
                        return null;
                    })()}
                </div>
            </div>

            {/* Help Panel */}
            <div className="absolute bottom-5 right-5 z-10 pointer-events-auto">
                <HelpPanel />
            </div>

            <div className="absolute top-0 left-0 w-full h-full">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Oval stroke="#c72f4e" strokeWidth={3} height="3em" />
                    </div>
                ) : graphData ? (
                    <GraphCard
                        key={query} // Reset graph on new query
                        nodes={graphData.nodes}
                        links={graphData.links}
                        onNodeClick={handleExpandNode}
                        onLinkClick={handleLinkClick}
                        selectedNodeId={artist?.id}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">Busca un artista para empezar</div>
                )}
            </div>
        </>
    );
}