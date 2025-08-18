// components/graph-card.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import GraphComponent from "@/components/grafo";
import { Nodo, Arista } from "@/lib/definiciones";

interface GraphCardProps {
    nodes: Nodo[];
    links: Arista[];
}

export default function GraphCard({ nodes, links }: GraphCardProps) {
    return (
        <Canvas camera={{ position: [0, 0, 30], fov: 25 }}>
            <GraphComponent nodes={nodes} links={links} />
        </Canvas>
    )
}