// components/graph-card.tsx
'use client'

import { Nodo, Arista } from "@/lib/definiciones";
import { useState } from 'react';
import Image from 'next/image';
import CytoscapeGraph from "./graph-cytoscape";

interface GraphCardProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
    layoutTrigger?: number;
}

export default function GraphCard({ nodes, links, onNodeClick, layoutTrigger }: GraphCardProps) {
    const [hoverInfo, setHoverInfo] = useState<{ node: any | null, x: number, y: number }>({ node: null, x: 0, y: 0 });

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <CytoscapeGraph
                nodes={nodes}
                links={links}
                onHover={setHoverInfo}
                onNodeClick={onNodeClick}
                layoutTrigger={layoutTrigger}
            />
            {hoverInfo.node && (
                <div className="graph-tooltip" style={{ position: 'absolute', top: `${hoverInfo.y}px`, left: `${hoverInfo.x}px`, pointerEvents: 'none' }}>
                    {hoverInfo.node.images?.[1] && (
                        <Image src={hoverInfo.node.images[1].url} alt={hoverInfo.node.name} width={hoverInfo.node.images[1].width} height={hoverInfo.node.images[1].height} />
                    )}
                    <strong>{hoverInfo.node.name}</strong>
                    <p>Popularidad: {hoverInfo.node.popularity}</p>
                    {hoverInfo.node.genres?.[0] && <p>Género: {hoverInfo.node.genres[0]}</p>}
                </div>
            )}
        </div>
    )
}