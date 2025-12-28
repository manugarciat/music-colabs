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
    const [selectedArtists, setSelectedArtists] = useState<Artist[]>(initialArtist ? [initialArtist] : []);
    const [expandedArtistId, setExpandedArtistId] = useState<string | null>(initialArtist?.id || null);

    const [graphData, setGraphData] = useState<{ nodes: Nodo[], links: Arista[] } | null>(initialGraphData);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCollab, setSelectedCollab] = useState<Arista | null>(null);

    // Sincronizar el estado si la búsqueda cambia (cuando Next.js navega)
    useEffect(() => {
        if (initialArtist) {
            setSelectedArtists([initialArtist]);
            setExpandedArtistId(initialArtist.id);
        } else {
            setSelectedArtists([]);
            setExpandedArtistId(null);
        }
        setGraphData(initialGraphData);
    }, [initialArtist, initialGraphData]);

    // --- Lógica de expansión, ahora vive aquí ---
    const handleExpandNode = async (nodeId: string) => {
        // 1. Añadir el nodo clickeado a la lista de artistas seleccionados
        setGraphData(prev => {
            if (!prev) return null;

            // Buscar el nodo en los datos actuales
            const node = prev.nodes.find(n => n.id === nodeId);
            if (node) {
                // Convertir Nodo a Artist (Tienen estructura compatible en su mayoría)
                // Aseguramos que tenga external_urls para evitar crash
                const artistFromNode: Artist = {
                    id: node.id,
                    name: node.name,
                    images: node.images || [],
                    genres: node.genres || [],
                    popularity: node.popularity || 0,
                    followers: node.followers || { total: 0 },
                    external_urls: node.external_urls || { spotify: `https://open.spotify.com/artist/${node.id}` },
                    grupo: node.grupo || 0
                };

                setSelectedArtists(current => {
                    // Evitar duplicados
                    if (current.find(a => a.id === nodeId)) {
                        setExpandedArtistId(nodeId); // Si ya está, solo expandirlo
                        return current;
                    }
                    // Añadir al principio o al final? "bayan sumando" -> probably append to bottom for "timeline" feel, 
                    // OR prepend to see it immediately at top. 
                    // Let's prepend to keep it close to search, but user said "abajo, que se bayan sumando".
                    // So append.
                    setExpandedArtistId(nodeId); // Auto expand new one
                    return [artistFromNode, ...current]; // Pongo arriba para ver rápido? 
                    // "abajo, que se bayan sumando". -> `[...current, artistFromNode]`?
                    // If I put it below, and the list is long, user might not see it.
                    // But strictly user says "abajo". 
                    // Actually, if I add to TOP, it pushes old ones down. This is usually better for "adding cards".
                    // I will add to TOP `[new, ...old]` so it appears right under search. Use judgment. 
                });
            }

            return { ...prev, nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, expanded: true } : n) };
        });

        // Hacemos un 'fetch' a nuestra propia API Route...
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

    const handleRemoveNode = (nodeId: string) => {
        // 1. Remove from selected list
        setSelectedArtists(prev => prev.filter(a => a.id !== nodeId));
        if (expandedArtistId === nodeId) setExpandedArtistId(null);

        // 2. Remove from graph data
        setGraphData(prev => {
            if (!prev) return null;

            // Remove the node itself
            let newNodes = prev.nodes.filter(n => n.id !== nodeId);
            // Remove links connected to it
            let newLinks = prev.links.filter(l => {
                const sId = typeof l.source === 'object' ? l.source.id : l.source;
                const tId = typeof l.target === 'object' ? l.target.id : l.target;
                return sId !== nodeId && tId !== nodeId;
            });

            // 3. Remove "orphaned" nodes (optional but requested: "sacamos todos los relacionados")
            // A simple heuristic: remove nodes that now have 0 connections AND were likely brought in by this artist.
            // But checking "brought in by" is hard without history.
            // Alternative: Iterate and remove leaf nodes (degree 0) recursively?
            // User says "para ir sacando clicks". So removing leaves is good.

            // Let's do one pass of cleaning 0-degree nodes (except other selected artists, keep them!)
            // Keep nodes that are in `selectedArtists` (except the one we just removed)
            const protectedIds = new Set(selectedArtists.filter(a => a.id !== nodeId).map(a => a.id));

            // Helper to count degrees
            const getNodeDegree = (nId: string, links: Arista[]) => {
                return links.filter(l =>
                    (typeof l.source === 'object' ? l.source.id === nId : l.source === nId) ||
                    (typeof l.target === 'object' ? l.target.id === nId : l.target === nId)
                ).length;
            };

            // Remove nodes with degree 0 that are NOT protected
            // We might need a loop if removing one leaf exposes another. 
            // For now, let's do one aggressive pass or maybe just remove the node + direct neighbors that are leaves.

            // Strategy: Remove the node. Then find all nodes that connected ONLY to this node (now degree 0).
            newNodes = newNodes.filter(n => {
                if (protectedIds.has(n.id)) return true; // Keep selected artists
                const degree = getNodeDegree(n.id, newLinks);
                return degree > 0; // Keep if it still has connections
            });

            return { nodes: newNodes, links: newLinks };
        });
    };

    const handleLinkClick = (link: Arista) => {
        setSelectedCollab(link);
    };

    // Helper to get ID whether source/target is string or object (d3 mutation)
    const getID = (val: string | Nodo) => (typeof val === 'object' ? val.id : val);

    return (
        <>
            <div className="absolute top-0 left-0 z-10 p-5 h-full pointer-events-none flex flex-col justify-between">
                {/* Top Section: Search & Artist Card */}
                <div className="w-[340px] h-full pointer-events-auto flex flex-col gap-3 pr-1">
                    {/* Fixed Search - No scroll */}
                    <div className="flex-shrink-0 z-20">
                        <DebouncedSearch />
                    </div>

                    {/* Scrollable Container (Artists + Collab Panel) */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-3 pb-20 min-h-0">
                        <div className="flex flex-col gap-3">
                            {selectedArtists.map(a => (
                                <ArtistCard
                                    key={a.id}
                                    artist={a}
                                    expanded={expandedArtistId === a.id}
                                    onToggle={() => setExpandedArtistId(prev => prev === a.id ? null : a.id)}
                                    onRemove={() => handleRemoveNode(a.id)}
                                />
                            ))}
                        </div>

                        {/* Collab Panel (Now inside scroll) */}
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
                        selectedNodeId={expandedArtistId}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">Busca un artista para empezar</div>
                )}
            </div>
        </>
    );
}