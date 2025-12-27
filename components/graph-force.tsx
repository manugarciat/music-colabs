'use client';

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import ForceGraph2D, { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d';
import { Nodo, Arista } from '@/lib/definiciones';

interface GraphForceProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
    onHover?: (node: Nodo | null) => void;
    width?: number;
    height?: number;
}

export default function GraphForce({ nodes, links, onNodeClick, onHover, width, height }: GraphForceProps) {
    const fgRef = useRef<ForceGraphMethods>();

    // Memoize data to prevent unnecessary re-renders
    const graphData = useMemo(() => {
        // We create shallow copies to allow mutation by the library without breaking upstream state
        return {
            nodes: nodes.map(n => ({
                ...n,
                fx: n.fx ?? undefined,
                fy: n.fy ?? undefined
            })),
            links: links.map(l => ({ ...l }))
        };
    }, [nodes, links]);

    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return;

        // --- AJUSTES DE FÍSICA / PHYSICS SETTINGS ---
        // Aquí es donde cambias qué tan separados están los nodos.

        // 1. Fuerza de repulsión (Charge): Valores negativos separan los nodos.
        // Cuanto más negativo, más se 'odian' y se alejan. Default es aprox -30.
        fg.d3Force('charge')?.strength(-300);

        // 2. Distancia de los enlaces (Link Distance): Longitud ideal de las líneas.
        // Aumentar esto separa los nodos conectados.
        fg.d3Force('link')?.distance(50);

        // 3. Centrado (Center): Mantiene el grafo en el medio.
        // fg.d3Force('center')?.strength(1); // Default suele estar bien

        // Reiniciar la simulación para que tome los cambios
        fg.d3ReheatSimulation();
    }, [nodes, links]); // Re-aplicar si cambian los datos

    // Preload images for canvas rendering
    const images = useMemo(() => {
        const imgs: Record<string, HTMLImageElement> = {};
        nodes.forEach(node => {
            if (node.images && node.images.length > 0) {
                const img = new Image();
                img.src = node.images[0].url; // Use smallest or first available
                imgs[node.id] = img;
            }
        });
        return imgs;
    }, [nodes]);

    const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
        const label = node.name;
        const fontSize = 12 / globalScale;
        const size = Math.max(5, (node.popularity || 0) / 5);

        // Draw Circle
        ctx.beginPath();
        const color = node.grupo === 0 ? '#ffD700' : node.expanded ? '#666' : '#c72f4e'; // Gold, Grey, or Red
        ctx.fillStyle = color;
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        ctx.fill();

        // Draw Image if available
        const img = images[node.id];
        if (img && img.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(node.x, node.y, size - 1, 0, 2 * Math.PI, false);
            ctx.clip();
            ctx.drawImage(img, node.x - size, node.y - size, size * 2, size * 2);
            ctx.restore();
        }

        // Draw Label
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(label, node.x, node.y + size + fontSize);

    }, [images]);

    return (
        <ForceGraph2D
            ref={fgRef}
            width={width}
            height={height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={node => (node as any).grupo === 0 ? '#ffD700' : '#c72f4e'}
            nodeRelSize={6}
            linkColor={() => 'rgba(255,255,255,0.2)'}
            linkWidth={1}
            nodeCanvasObject={paintNode}
            onNodeClick={(node) => onNodeClick(node.id as string)}
            onNodeHover={(node) => onHover && onHover(node as Nodo || null)}
            enableNodeDrag={true}
            cooldownTicks={100}
            backgroundColor="rgba(0,0,0,0)" // Transparent for glassmorphism
        />
    );
}
