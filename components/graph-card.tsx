// components/graph-card.tsx
'use client'

import { Canvas } from '@react-three/fiber'
import GraphComponent from "@/components/grafo";
import { Nodo, Arista } from "@/lib/definiciones";
// --- NUEVO: Importar useState y useEffect ---
import { useState, useEffect } from 'react';

interface GraphCardProps {
    nodes: Nodo[];
    links: Arista[];
}

export default function GraphCard({ nodes, links }: GraphCardProps) {
    // --- NUEVO: Estado para controlar el renderizado en el cliente ---
    const [isMounted, setIsMounted] = useState(false);

    // Este efecto se ejecuta solo una vez en el cliente, después del montaje inicial.
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Si el componente aún no se ha montado en el cliente, no renderizamos nada.
    if (!isMounted) {
        return null;
    }

    // Una vez montado, renderizamos el Canvas de forma segura.
    return (
        <Canvas camera={{ position: [0, 0, 30], fov: 25 }}>
            <GraphComponent nodes={nodes} links={links} />
        </Canvas>
    )
}