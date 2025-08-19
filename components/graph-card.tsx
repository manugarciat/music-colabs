// components/graph-card.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import GraphComponent from "@/components/grafo";
import { Nodo, Arista } from "@/lib/definiciones";
// --- NUEVO: Importar useState ---
import { useState } from 'react';

interface GraphCardProps {
    nodes: Nodo[];
    links: Arista[];
}

export default function GraphCard({ nodes, links }: GraphCardProps) {
    // --- NUEVO: El estado del tooltip ahora vive aquí ---
    const [hoverInfo, setHoverInfo] = useState<{ node: Nodo | null, x: number, y: number }>({ node: null, x: 0, y: 0 });

    return (
        // Usamos un div relativo para posicionar el tooltip sobre el canvas
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 0, 30], fov: 25 }}>
                {/* Pasamos la función para actualizar el estado a la escena 3D */}
                <GraphComponent nodes={nodes} links={links} onHover={setHoverInfo} />
            </Canvas>

            {/* --- El Tooltip se renderiza aquí, como hermano del Canvas --- */}
            {hoverInfo.node && (
                <div
                    className="graph-tooltip"
                    style={{
                        position: 'fixed',
                        top: `${hoverInfo.y + 10}px`,
                        left: `${hoverInfo.x + 10}px`,
                        pointerEvents: 'none'
                    }}
                >
                    <strong>{hoverInfo.node.name}</strong>
                    <p>Popularidad: {hoverInfo.node.popularity}</p>
                    {hoverInfo.node.genres[0] && <p>Género: {hoverInfo.node.genres[0]}</p>}
                </div>
            )}
        </div>
    )
}