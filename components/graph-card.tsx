// components/graph-card.tsx
'use client'

import { Nodo, Arista } from "@/lib/definiciones";
import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const GraphForce = dynamic(() => import('./graph-force'), { ssr: false });

interface GraphCardProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
    selectedNodeId?: string | null;
}

export default function GraphCard({ nodes, links, onNodeClick, selectedNodeId }: GraphCardProps) {
    const [hoverInfo, setHoverInfo] = useState<{ node: any | null, x: number, y: number }>({ node: null, x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (hoverInfo.node) {
            setHoverInfo(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
        }
    };

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            onMouseMove={handleMouseMove}
        >
            <GraphForce
                nodes={nodes}
                links={links}
                onHover={(node) => setHoverInfo(prev => ({ ...prev, node }))}
                onNodeClick={onNodeClick}
                selectedNodeId={selectedNodeId}
            />
            {hoverInfo.node && (
                <div className="graph-tooltip z-50 bg-black/80 text-white p-3 rounded backdrop-blur-md border border-white/10"
                    style={{ position: 'fixed', top: `${hoverInfo.y + 10}px`, left: `${hoverInfo.x + 10}px`, pointerEvents: 'none' }}>
                    {hoverInfo.node.images?.[1] && (
                        <div className="w-16 h-16 relative mb-2 rounded overflow-hidden">
                            <Image src={hoverInfo.node.images[1].url} alt={hoverInfo.node.name} fill className="object-cover" />
                        </div>
                    )}
                    <strong>{hoverInfo.node.name}</strong>
                    <p className="text-xs opacity-70">Popularidad: {hoverInfo.node.popularity}</p>
                    {hoverInfo.node.genres?.[0] && <p>Género: {hoverInfo.node.genres[0]}</p>}
                </div>
            )}
        </div>
    )
}