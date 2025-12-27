'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { Nodo, Arista } from '@/lib/definiciones';
import * as THREE from 'three';

interface GraphForceProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
    onHover?: (node: Nodo | null) => void;
    width?: number;
    height?: number;
}

// Helper to generate circular alpha map
function getCircleAlphaMap() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(64, 64, 60, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

export default function GraphForce({ nodes, links, onNodeClick, onHover, width, height }: GraphForceProps) {
    const fgRef = useRef<ForceGraphMethods>();

    // Create the alpha map once
    const alphaMap = useMemo(() => getCircleAlphaMap(), []);

    // Memoize and sanitize data
    const graphData = useMemo(() => {
        // Filter out any potentially invalid nodes or links if necessary
        // For now, we just ensure deep enough copying and property safety
        const safeNodes = nodes.map(n => ({
            ...n,
            fx: n.fx ?? undefined,
            fy: n.fy ?? undefined,
            fz: n.fz ?? undefined
        }));

        const safeLinks = links.map(l => ({ ...l }));

        return { nodes: safeNodes, links: safeLinks };
    }, [nodes, links]);

    // Physics configuration
    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return; // Wait for ref

        // Safety timeout to ensure graph is initialized before messing with d3
        const timer = setTimeout(() => {
            // force graph instance might have d3Force method
            if (fg.d3Force) {
                const charge = fg.d3Force('charge');
                const link = fg.d3Force('link');

                if (charge) charge.strength(-100);
                if (link) link.distance(70);

                fg.d3ReheatSimulation();
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [graphData]); // Re-run when data changes

    const nodeThreeObject = useCallback((node: any) => {
        const expanded = node.expanded;
        const root = node.grupo === 0;

        // Image Sprite
        if (node.images && node.images.length > 0) {
            const imgUrl = node.images[0].url;
            const map = new THREE.TextureLoader().load(imgUrl);

            const material = new THREE.SpriteMaterial({
                map: map,
                alphaMap: alphaMap || null, // Apply circular mask
                transparent: true,
                color: 0xffffff
            });

            const sprite = new THREE.Sprite(material);
            const size = Math.max(12, (node.popularity || 0) / 3);
            sprite.scale.set(size, size, 1);
            return sprite;
        }

        // Fallback Sphere
        const size = Math.max(4, (node.popularity || 0) / 10);
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const color = root ? 0xffd700 : expanded ? 0xaaaaaa : 0xc72f4e;
        const material = new THREE.MeshLambertMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Mesh(geometry, material);
    }, [alphaMap]); // Dependency on alphaMap

    return (
        <ForceGraph3D
            ref={fgRef}
            width={width}
            height={height}
            graphData={graphData}
            nodeLabel="name"
            nodeThreeObject={nodeThreeObject}

            // Interaction
            onNodeClick={(node) => onNodeClick(node.id as string)}
            onNodeHover={(node) => onHover && onHover(node as Nodo || null)}

            // Visuals
            backgroundColor="rgba(0,0,0,0)"
            showNavInfo={false}
            controlType="orbit"

            // Render options
            rendererConfig={{
                alpha: true,
                antialias: true
            }}
        />
    );
}
