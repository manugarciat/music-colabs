// components/grafo.tsx
'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Line, MapControls } from '@react-three/drei'
import { Physics, RigidBody, RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { Nodo, Arista } from "@/lib/definiciones";

// --- COMPONENTE PARA UN SOLO NODO ---
function ArtistNode({ rigidBodyRef }: { rigidBodyRef: React.RefObject<RapierRigidBody> }) {
    const initialPosition = useMemo(() => new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5), []);
    return (
        <RigidBody ref={rigidBodyRef} restitution={0.8} position={initialPosition}>
            <Sphere args={[0.5, 32, 32]}>
                <meshStandardMaterial color={'hotpink'} />
            </Sphere>
        </RigidBody>
    );
}

// --- COMPONENTE PARA UNA SOLA LÍNEA DE CONEXIÓN ---
function LinkLine({ sourceRef, targetRef }: { sourceRef: React.RefObject<RapierRigidBody>, targetRef: React.RefObject<RapierRigidBody> }) {
    const lineRef = useRef<THREE.Line>(null!);
    const points = useMemo(() => [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)], []);

    useFrame(() => {
        if (sourceRef.current && targetRef.current) {
            const sourcePos = sourceRef.current.translation();
            const targetPos = targetRef.current.translation();
            points[0].set(sourcePos.x, sourcePos.y, sourcePos.z);
            points[1].set(targetPos.x, targetPos.y, targetPos.z);
            lineRef.current.geometry.setFromPoints(points);
        }
    });

    return <Line ref={lineRef} points={points} color="white" lineWidth={0.5} transparent opacity={0.5} />;
}

// --- PROPS PARA EL COMPONENTE PRINCIPAL ---
interface GraphComponentProps {
    nodes: Nodo[];
    links: Arista[];
}

// --- COMPONENTE PRINCIPAL DEL GRAFO ---
export default function GraphComponent({ nodes, links }: GraphComponentProps) {

    // El mapa de refs se crea una vez por cada renderizado del componente
    const rigidBodyRefs = useMemo(() => {
        const refs: { [key: string]: React.RefObject<RapierRigidBody> } = {};
        nodes.forEach(node => {
            refs[node.id] = React.createRef<RapierRigidBody>();
        });
        return refs;
    }, [nodes]);

    return (
        <>
            <MapControls />
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} />

            {/* Añadimos damping para que el grafo no se expanda infinitamente */}
            <Physics gravity={[0, 0, 0]} colliders="ball" damping={4}>
                {nodes.map(node => (
                    <ArtistNode key={node.id} rigidBodyRef={rigidBodyRefs[node.id]} />
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