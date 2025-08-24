// components/graph-card.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import GraphComponent from "@/components/grafo";
import { Nodo, Arista } from "@/lib/definiciones";
import { useState } from 'react';
// --- NUEVO: Importar el componente Image de Next.js ---
import Image from 'next/image';

interface GraphCardProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
}

export default function GraphCard({ nodes, links, onNodeClick }: GraphCardProps) {
    const [hoverInfo, setHoverInfo] = useState<{ node: Nodo | null, x: number, y: number }>({ node: null, x: 0, y: 0 });

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 0, 30], fov: 25 }}>
                <GraphComponent nodes={nodes} links={links} onHover={setHoverInfo} onNodeClick={onNodeClick} />
            </Canvas>

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
                    {/* --- ¡AQUÍ ESTÁ LA MAGIA! --- */}
                    {/* Renderizamos la imagen si existe en el array de imágenes del artista. */}
                    {/* Usamos images[1] que suele ser de tamaño mediano, ideal para un tooltip. */}
                    {hoverInfo.node.images?.[1] && (
                        <Image
                            src={hoverInfo.node.images[1].url}
                            alt={hoverInfo.node.name}
                            width={hoverInfo.node.images[1].width}
                            height={hoverInfo.node.images[1].height}
                        />
                    )}

                    <strong>{hoverInfo.node.name}</strong>
                    <p>Popularidad: {hoverInfo.node.popularity}</p>
                    {hoverInfo.node.genres[0] && <p>Género: {hoverInfo.node.genres[0]}</p>}
                </div>
            )}
        </div>
    )
}