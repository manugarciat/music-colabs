// components/grafo.tsx
'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line, MapControls } from '@react-three/drei'
import { Physics, RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { Nodo, Arista } from "@/lib/definiciones";

// (La función scalePopularity no cambia)
const scalePopularity = (popularity: number) => {
    const minRadius = 0.4;
    const maxRadius = 1.5;
    return minRadius + (maxRadius - minRadius) * (popularity / 100);
}

// --- ArtistNode AHORA RECIBE onNodeClick ---
function ArtistNode({
    node,
    rigidBodyRef,
    onHover,
    onNodeClick // <-- Nueva prop
}: {
    node: Nodo,
    rigidBodyRef: React.RefObject<RapierRigidBody>,
    onHover: (hoverData: { node: Nodo | null, x: number, y: number }) => void,
    onNodeClick: (nodeId: string) => void // <-- Tipo de la nueva prop
}) {
    const initialPosition = useMemo(() => new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5), []);
    const radius = useMemo(() => scalePopularity(node.popularity), [node.popularity]);

    return (
        <RigidBody ref={rigidBodyRef} restitution={0.8} position={initialPosition}>
            <Sphere
                args={[radius, 32, 32]}
                onPointerOver={(e) => { e.stopPropagation(); onHover({ node, x: e.clientX, y: e.clientY }); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { onHover({ node: null, x: 0, y: 0 }); document.body.style.cursor = 'default'; }}
                // --- NUEVO: Evento onClick ---
                onClick={() => {
                    // Si el nodo no ha sido expandido, llama a la función
                    if (!node.expanded) {
                        onNodeClick(node.id);
                    }
                }}
            >
                {/* --- Color dinámico: gris si ya fue expandido --- */}
                <meshStandardMaterial color={node.grupo === 0 ? 'gold' : node.expanded ? '#666' : '#c72f4e'} />
            </Sphere>
        </RigidBody>
    );
}

// (LinkLine no cambia)
function LinkLine({ sourceRef, targetRef }: { sourceRef: React.RefObject<RapierRigidBody>, targetRef: React.RefObject<RapierRigidBody> }) { /* ...código sin cambios... */ }

// --- GraphComponent AHORA RECIBE onNodeClick ---
interface GraphComponentProps {
    nodes: Nodo[];
    links: Arista[];
    onHover: (hoverData: { node: Nodo | null, x: number, y: number }) => void;
    onNodeClick: (nodeId: string) => void; // <-- Nueva prop
}

export default function GraphComponent({ nodes, links, onHover, onNodeClick }: GraphComponentProps) {
    const rigidBodyRefs = useMemo(() => {
        const refs: { [key: string]: React.RefObject<RapierRigidBody> } = {};
        nodes.forEach(node => { refs[node.id] = React.createRef<RapierRigidBody>(); });
        return refs;
    }, [nodes]);

    return (
        <>
            <MapControls />
            <Physics gravity={[0, 0, 0]} colliders="ball" damping={4}>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} />

                {nodes.map(node => (
                    <ArtistNode
                        key={node.id}
                        node={node}
                        rigidBodyRef={rigidBodyRefs[node.id]}
                        onHover={onHover}
                        onNodeClick={onNodeClick} // <-- Pasar la función al nodo
                    />
                ))}

                {links.map((link, index) => {
                    const sourceRef = rigidBodyRefs[link.source as string];
                    const targetRef = rigidBodyRefs[link.target as string];
                    if (sourceRef && targetRef) {
                        return <LinkLine key={index} sourceRef={sourceRef} targetRef={targetRef} />
                    }
                    return null;
                })}
            </Physics>
        </>
    );
}