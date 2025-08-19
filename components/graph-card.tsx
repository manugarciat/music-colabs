// components/graph-card.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import GraphComponent from "@/components/grafo";
import { Nodo, Arista } from "@/lib/definiciones";
import { useState } from 'react';

// --- NUEVO: Añadir onNodeClick a las props ---
interface GraphCardProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void; // <-- Nueva prop
}

export default function GraphCard({ nodes, links, onNodeClick }: GraphCardProps) {
    const [hoverInfo, setHoverInfo] = useState<{ node: Nodo | null, x: number, y: number }>({ node: null, x: 0, y: 0 });

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 0, 30], fov: 25 }}>
                <GraphComponent nodes={nodes} links={links} onHover={setHoverInfo} onNodeClick={onNodeClick} />
            </Canvas>
            {hoverInfo.node && (
                <div className="graph-tooltip" style={{ position: 'fixed', top: `${hoverInfo.y + 10}px`, left: `${hoverInfo.x + 10}px`, pointerEvents: 'none' }}>
                    <strong>{hoverInfo.node.name}</strong>
                    <p>Popularidad: {hoverInfo.node.popularity}</p>
                    {hoverInfo.node.genres[0] && <p>Género: {hoverInfo.node.genres[0]}</p>}
                </div>
            )}
        </div>
    )
}