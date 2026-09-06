// components/graph-container.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { Oval } from 'react-loading-icons';
import DebouncedSearch from "@/components/debounced-search";
import ArtistCard from "@/components/artist-card";
import GraphCard from "@/components/graph-card";
import CollabPanel from "@/components/collab-panel";
import HelpPanel from "@/components/help-panel";
import GraphMetrics from "@/components/graph-metrics";
import { Nodo, Arista, Artist } from "@/lib/definiciones";

export interface LogEntry {
    id: string;
    timestamp: string;
    tag: string;
    message: string;
    level?: 'info' | 'success' | 'warn' | 'accent' | 'matrix';
    detail?: string;
}

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
    const [loadingArtist, setLoadingArtist] = useState<{ id: string; name: string } | null>(null);
    const [expandingArtistName, setExpandingArtistName] = useState<string | null>(null);
    const [selectedCollab, setSelectedCollab] = useState<Arista | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const addLog = React.useCallback((tag: string, message: string, level: LogEntry['level'] = 'info', detail?: string) => {
        const now = new Date();
        const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
        setLogs(prev => [
            ...prev.slice(-120), // Conservar últimos 120 logs
            {
                id: Math.random().toString(36).substring(2, 9),
                timestamp,
                tag,
                message,
                level,
                detail
            }
        ]);
    }, []);

    // Sincronizar el estado si la búsqueda cambia (cuando Next.js navega)
    useEffect(() => {
        if (initialArtist) {
            setSelectedArtists([initialArtist]);
            setExpandedArtistId(initialArtist.id);
            addLog('ROOT_RESOLVE', `Root vertex loaded: "${initialArtist.name}"`, 'accent', `ID: ${initialArtist.id} | Popularity: ${initialArtist.popularity}%`);
            
            if (initialGraphData) {
                const sampleColabs = initialGraphData.nodes
                    .filter(n => n.id !== initialArtist.id)
                    .slice(0, 5)
                    .map(n => n.name)
                    .join(', ');
                addLog('TOPOLOGY', `Graph initialized: ${initialGraphData.nodes.length} nodes, ${initialGraphData.links.length} edges`, 'matrix', sampleColabs ? `Collaborators: ${sampleColabs}...` : undefined);
                addLog('FORCE_LAYOUT', '3D spatial simulation active (charge: -100, linkDist: 70)', 'success');
            }
        } else {
            setSelectedArtists([]);
            setExpandedArtistId(null);
            addLog('SYSTEM', 'Graph runtime standing by. Enter an artist name to begin traversal.', 'info');
        }
        setGraphData(initialGraphData);
        setLoadingArtist(null);
    }, [initialArtist, initialGraphData, addLog]);

    // Simulación estética de telemetría mientras el servidor procesa el catálogo de Spotify
    useEffect(() => {
        if (!loadingArtist) return;
        const steps = [
            { tag: 'DISCOGRAPHY', msg: `Querying catalog releases (album, single, appears_on)...`, delay: 350 },
            { tag: 'BATCH_TRACKS', msg: `Chunking album tracklists in parallel batches of 20...`, delay: 850 },
            { tag: 'COLLAB_PARSER', msg: `Parsing co-author metadata & deduplicating artist IDs...`, delay: 1400 },
            { tag: 'GRAPH_CORE', msg: `Constructing adjacency list with Graphlib engine...`, delay: 2100 },
        ];
        const timers = steps.map(s => setTimeout(() => {
            addLog(s.tag, s.msg, 'info');
        }, s.delay));
        return () => timers.forEach(t => clearTimeout(t));
    }, [loadingArtist, addLog]);

    // --- Lógica de expansión, ahora vive aquí ---
    const handleExpandNode = async (nodeId: string) => {
        const node = graphData?.nodes.find(n => n.id === nodeId);
        const artistName = node?.name || nodeId;
        setExpandingArtistName(artistName);

        addLog('EXPAND_TARGET', `Expanding vertex: "${artistName}"`, 'accent', `Node ID: ${nodeId}`);
        addLog('DISCOGRAPHY', `Querying albums and singles for "${artistName}"...`, 'info');

        const timer1 = setTimeout(() => {
            addLog('BATCH_TRACKS', `Scanning release tracklists for co-credits...`, 'info');
        }, 500);
        const timer2 = setTimeout(() => {
            addLog('COLLAB_PARSER', `Resolving unlinked artist signatures...`, 'info');
        }, 1200);

        try {
            const response = await fetch(`/api/collabs/${nodeId}`);
            clearTimeout(timer1);
            clearTimeout(timer2);
            if (!response.ok) throw new Error("Failed to fetch collabs");
            const { newNodes, newLinks } = await response.json();

            setGraphData(prev => {
                if (!prev) return null;
                const existingNodeIds = new Set(prev.nodes.map(n => n.id));
                const uniqueNewNodes = (newNodes || []).filter((n: Nodo) => !existingNodeIds.has(n.id));

                const existingLinks = new Set(prev.links.map(l => `${l.source}-${l.target}`));
                const uniqueNewLinks = (newLinks || []).filter((l: Arista) =>
                    !existingLinks.has(`${l.source}-${l.target}`) &&
                    !existingLinks.has(`${l.target}-${l.source}`)
                );

                const finalNodes = [...prev.nodes, ...uniqueNewNodes];
                const finalLinks = [...prev.links, ...uniqueNewLinks];

                addLog('DISCOVER', `Discovered +${uniqueNewNodes.length} new vertices and +${uniqueNewLinks.length} collaboration links`, 'success', uniqueNewNodes.length > 0 ? `Integrated: ${uniqueNewNodes.slice(0, 4).map((n: Nodo) => n.name).join(', ')}${uniqueNewNodes.length > 4 ? '...' : ''}` : 'All discovered collaborators already exist in topology');
                addLog('MATRIX_UPDATE', `Total topology size: ${finalNodes.length} vertices, ${finalLinks.length} edges`, 'matrix');

                return {
                    nodes: finalNodes,
                    links: finalLinks
                };
            });

            // Añadir el nodo clickeado a la lista de artistas seleccionados
            if (node) {
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
                    if (current.find(a => a.id === nodeId)) {
                        setExpandedArtistId(nodeId);
                        return current;
                    }
                    setExpandedArtistId(nodeId);
                    return [artistFromNode, ...current];
                });
            }

            // Pequeña pausa para que el usuario pueda apreciar el resultado antes de cerrar el modal
            await new Promise(res => setTimeout(res, 500));
        } catch (error) {
            clearTimeout(timer1);
            clearTimeout(timer2);
            console.error("Error expanding node:", error);
            addLog('ERROR', `Failed to expand vertex "${artistName}"`, 'warn');
        } finally {
            setExpandingArtistName(null);
        }
    };

    const handleRemoveNode = (nodeId: string) => {
        const removed = selectedArtists.find(a => a.id === nodeId);
        addLog('PRUNE_NODE', `Pruning vertex "${removed?.name || nodeId}" from active exploration`, 'warn');
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
        const sID = getID(link.source as any);
        const tID = getID(link.target as any);
        const sNode = graphData?.nodes.find(n => n.id === sID);
        const tNode = graphData?.nodes.find(n => n.id === tID);
        const tracks = link.tracks || [];
        addLog('EDGE_INSPECT', `Connection inspected: "${sNode?.name || sID}" <--> "${tNode?.name || tID}"`, 'accent', `${tracks.length} shared track(s) recorded`);
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
                        <DebouncedSearch onSelectArtist={(artist) => {
                            setLoadingArtist({ id: artist.id, name: artist.name });
                            addLog('QUERY_DISPATCH', `Target artist selected: "${artist.name}"`, 'accent', `ID: ${artist.id}`);
                            addLog('SERVERLESS', 'Invoking Server Component pipeline to Spotify Graph API...', 'info');
                        }} />
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

            {/* Bottom Controls: Graph Metrics + Help Panel */}
            <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2.5 pointer-events-auto">
                <GraphMetrics
                    nodes={graphData?.nodes || []}
                    links={graphData?.links || []}
                    isComputing={!!loadingArtist || !!expandingArtistName}
                />
                <HelpPanel />
            </div>

            {/* Fullscreen Overlay: Loading initial artist graph OR expanding node */}
            {(loadingArtist || expandingArtistName || isLoading) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
                    <div className="bg-[#121216]/95 border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center w-[90%] max-w-md mx-4 backdrop-blur-xl font-mono">
                        <div className="relative flex items-center justify-center w-14 h-14">
                            <div className="w-14 h-14 rounded-full border-2 border-white/10 border-t-[#1DB954] animate-spin"></div>
                            <div className="absolute w-8 h-8 rounded-full bg-[#1DB954]/20 blur-md animate-pulse"></div>
                            <div className="absolute w-2.5 h-2.5 rounded-full bg-[#1DB954]"></div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center justify-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-ping"></span>
                                {expandingArtistName ? "AMPLIANDO RED DE COLABORACIONES" : "GENERANDO RED TOPOLÓGICA"}
                            </h3>
                            <p className="text-xs text-white/60">
                                {expandingArtistName ? (
                                    <>
                                        Artista: <span className="text-[#1DB954] font-semibold">{expandingArtistName}</span>
                                    </>
                                ) : loadingArtist ? (
                                    <>
                                        Artista: <span className="text-[#1DB954] font-semibold">{loadingArtist.name}</span>
                                    </>
                                ) : (
                                    "Analizando colaboraciones en Spotify..."
                                )}
                            </p>
                        </div>

                        {/* Mini Live Logs Feed in Loading Modal */}
                        <div className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-left space-y-1 max-h-32 overflow-hidden shadow-inner">
                            <div className="flex items-center justify-between text-[9px] text-white/30 pb-1 border-b border-white/5">
                                <span>PROCESO_EN_VIVO</span>
                                <span className="text-[#1DB954] font-semibold animate-pulse">ACTIVO</span>
                            </div>
                            {logs.slice(-4).map(l => (
                                <div key={l.id} className="text-[10px] truncate leading-tight flex items-center gap-1.5">
                                    <span className="text-[#1DB954] font-bold">&gt;</span>
                                    <span className="text-white/40 text-[9px]">[{l.tag}]</span>
                                    <span className="text-white/80">{l.message}</span>
                                </div>
                            ))}
                        </div>

                        {/* Indeterminate progress bar */}
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-gradient-to-r from-transparent via-[#1DB954] to-transparent w-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="absolute top-0 left-0 w-full h-full">
                {graphData ? (
                    <GraphCard
                        key={query} // Reset graph on new query
                        nodes={graphData.nodes}
                        links={graphData.links}
                        onNodeClick={handleExpandNode}
                        onLinkClick={handleLinkClick}
                        selectedNodeId={expandedArtistId}
                    />
                ) : !loadingArtist && !isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4 pointer-events-none">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-medium text-white/70">Busca un artista para empezar</h3>
                        <p className="text-xs text-white/35 max-w-xs">Escribe en el buscador para visualizar y explorar su red de colaboraciones.</p>
                    </div>
                ) : null}
            </div>
        </>
    );
}