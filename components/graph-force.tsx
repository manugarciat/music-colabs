'use client';

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import { Nodo, Arista } from '@/lib/definiciones';
import * as THREE from 'three';
import { Maximize2, RotateCcw } from 'lucide-react';

interface GraphForceProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
    onHover?: (node: Nodo | null) => void;
    width?: number;
    height?: number;
    selectedNodeId?: string | null;
}

// Helper to generate alpha maps
// Helper to generate circular alpha map
function getCircleAlphaMap() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
}

export default function GraphForce({ nodes, links, onNodeClick, onHover, width, height, selectedNodeId }: GraphForceProps) {
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
        const isSelected = selectedNodeId === node.id;
        const isHighlighted = isSelected || expanded;

        // Image Sprite
        if (node.images && node.images.length > 0) {
            const imgUrl = node.images[0].url;
            const map = new THREE.TextureLoader().load(imgUrl);

            const group = new THREE.Group();
            const size = Math.max(12, (node.popularity || 0) / 3);

            // 1. Border Sprite (Background Disk)
            const borderMaterial = new THREE.SpriteMaterial({
                map: alphaMap || null, // Use solid disk
                color: isHighlighted ? 0x00d2ff : (root ? 0xffd700 : 0xffffff),
                transparent: true,
                opacity: isHighlighted ? 1 : 0.6,
                depthWrite: false
            });
            const borderSprite = new THREE.Sprite(borderMaterial);
            // Slightly larger to create border effect
            borderSprite.scale.set(size * 1.1, size * 1.1, 1);
            borderSprite.renderOrder = 1; // Render BEHIND
            group.add(borderSprite);

            // 2. Image Sprite (Foreground)
            const material = new THREE.SpriteMaterial({
                map: map,
                alphaMap: alphaMap || null,
                transparent: true,
                color: 0xffffff,
                depthWrite: false
            });

            const sprite = new THREE.Sprite(material);
            sprite.scale.set(size, size, 1);
            sprite.renderOrder = 2; // Render IN FRONT
            group.add(sprite);

            return group;
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
    }, [alphaMap, selectedNodeId]); // Re-create when selection changes



    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleResetView = () => {
        const fg = fgRef.current;
        if (fg) {
            fg.cameraPosition(
                { x: 0, y: 0, z: 300 }, // Position
                { x: 0, y: 0, z: 0 },   // LookAt
                1000                    // Transition ms
            );
        }
    };

    return (
        <div className="relative w-full h-full">
            <div className="absolute top-5 right-5 z-50 flex flex-col gap-2">
                <button
                    onClick={handleResetView}
                    className="p-2 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white rounded-lg backdrop-blur-sm border border-white/10 transition-colors"
                    title="Reset Camera"
                >
                    <RotateCcw size={20} />
                </button>
                <button
                    onClick={handleFullscreen}
                    className="p-2 bg-black/50 hover:bg-black/80 text-white/80 hover:text-white rounded-lg backdrop-blur-sm border border-white/10 transition-colors"
                    title="Toggle Fullscreen"
                >
                    <Maximize2 size={20} />
                </button>
            </div>

            <ForceGraph3D
                ref={fgRef}
                width={width}
                height={height}
                graphData={graphData}
                nodeLabel={() => ''}
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
        </div>
    );
}
