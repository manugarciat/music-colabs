// components/graph-card.tsx
'use client'

import { Nodo, Arista } from "@/lib/definiciones";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const GraphForce = dynamic(() => import('./graph-force'), { ssr: false });

interface GraphCardProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
    onLinkClick?: (link: Arista) => void;
    selectedNodeId?: string | null;
}

export default function GraphCard({ nodes, links, onNodeClick, onLinkClick, selectedNodeId }: GraphCardProps) {
    const [tooltip, setTooltip] = useState<{
        type: 'node' | 'link' | null;
        data: any | null;
        x: number;
        y: number;
    }>({ type: null, data: null, x: 0, y: 0 });

    // Handle mouse move for non-sticky tooltip
    const handleMouseMove = (e: React.MouseEvent) => {
        if (tooltip.type) {
            setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
        }
    };

    // --- Hover Handlers ---
    const handleNodeHover = useCallback((node: Nodo | null) => {
        if (node) {
            setTooltip(prev => ({ ...prev, type: 'node', data: node }));
        } else {
            setTooltip(prev => ({ ...prev, type: null, data: null }));
        }
    }, [])

    const handleLinkHover = useCallback((link: Arista | null) => {
        if (link && link.tracks && link.tracks.length > 0) {
            setTooltip(prev => {
                if (prev.data?.link === link) return prev; // No change

                // Find source/target nodes to display images
                // We need to access 'nodes' from closure. 
                // Since 'nodes' changes when graph expands, we need it in dependency.
                const getID = (val: string | Nodo) => (typeof val === 'object' ? val.id : val);
                const sourceID = getID(link.source as any);
                const targetID = getID(link.target as any);

                const sourceNode = nodes.find(n => n.id === sourceID);
                const targetNode = nodes.find(n => n.id === targetID);

                return {
                    ...prev,
                    type: 'link',
                    data: { link, sourceNode, targetNode }
                };
            });
        } else {
            setTooltip(prev => (prev.type === 'link' ? { ...prev, type: null, data: null } : prev));
        }
    }, [nodes]); // Depend on nodes

    // --- Click Handlers ---
    const handleNodeClickInternal = useCallback((nodeId: string) => {
        // Trigger parent expansion logic
        onNodeClick(nodeId);
    }, [onNodeClick]);

    const handleLinkClickInternal = useCallback((link: Arista) => {
        if (onLinkClick) onLinkClick(link);
    }, [onLinkClick]);

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseMove={handleMouseMove}
        >
            <GraphForce
                nodes={nodes}
                links={links}
                // Hover
                onHover={handleNodeHover}
                onHoverLink={handleLinkHover}
                // Click
                onNodeClick={handleNodeClickInternal}
                onLinkClick={handleLinkClickInternal}

                selectedNodeId={selectedNodeId}
                hoveredLink={tooltip.type === 'link' ? tooltip.data.link : null}
            />

            {/* Tooltip Render (Hover Only) */}
            {tooltip.type && tooltip.data && (
                <div
                    className="graph-tooltip z-50 bg-black/95 text-white p-3 rounded-xl backdrop-blur-md border border-white/10 shadow-lg pointer-events-none"
                    style={{
                        position: 'fixed',
                        top: `${tooltip.y + 80}px`,
                        left: `${tooltip.x + 100}px`,
                        transform: 'translate(-50%, -100%)',
                        pointerEvents: 'none',
                        zIndex: 50,
                    }}
                >
                    {/* NODE TOOLTIP */}
                    {tooltip.type === 'node' && (
                        <>
                            {tooltip.data.images?.[1] && (
                                <div className="w-16 h-16 relative mb-2 rounded-full overflow-hidden border border-white/20 mx-auto">
                                    <Image src={tooltip.data.images[1].url} alt={tooltip.data.name} fill className="object-cover" />
                                </div>
                            )}
                            <div className="text-center">
                                <strong className="text-lg block">{tooltip.data.name}</strong>
                                <p className="text-xs opacity-60 uppercase tracking-widest mt-1">Popularidad: {tooltip.data.popularity}</p>
                                {tooltip.data.genres?.[0] && <p className="text-xs text-brand-pink mt-1 capitalize">{tooltip.data.genres[0]}</p>}
                            </div>
                        </>
                    )}

                    {/* LINK TOOLTIP (Expanded Hover Preview) */}
                    {tooltip.type === 'link' && tooltip.data.link && (
                        <div>
                            {/* Connection Header */}
                            <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2">
                                <div className="flex -space-x-2">
                                    {tooltip.data.sourceNode?.images?.[2] && (
                                        <div className="w-6 h-6 relative rounded-full overflow-hidden border border-[#18181b] z-10">
                                            <Image src={tooltip.data.sourceNode.images[2].url} alt="" fill className="object-cover" />
                                        </div>
                                    )}
                                    {tooltip.data.targetNode?.images?.[2] && (
                                        <div className="w-6 h-6 relative rounded-full overflow-hidden border border-[#18181b] z-0">
                                            <Image src={tooltip.data.targetNode.images[2].url} alt="" fill className="object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col leading-[1.1]">
                                    <h4 className="text-[10px] font-bold text-white/90">
                                        {tooltip.data.sourceNode?.name} & {tooltip.data.targetNode?.name}
                                    </h4>
                                    <span className="text-[9px] text-white/50">{tooltip.data.link.tracks.length} colaboraciones</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                {tooltip.data.link.tracks.slice(0, 5).map((track: any) => (
                                    <div key={track.id} className="flex items-center gap-1.5 opacity-80">
                                        <div className="w-1 h-1 bg-[#1DB954] rounded-full"></div>
                                        <span className="text-xs truncate max-w-[180px]">{track.name}</span>
                                    </div>
                                ))}
                                {tooltip.data.link.tracks.length > 5 && (
                                    <span className="text-[9px] text-white/40 italic pl-2.5">+{tooltip.data.link.tracks.length - 5} más...</span>
                                )}
                            </div>
                            <div className="mt-2 text-[9px] text-[#1DB954] font-medium text-center border-t border-white/10 pt-1 tracking-wide">
                                CLICK PARA ESCUCHAR
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}