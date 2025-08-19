// components/grafo.tsx
'use client'

// --- MODIFICADO: Quitar useState de los imports ---
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

// (El componente ArtistNode no cambia, ya está preparado para recibir 'onHover')
function ArtistNode({
    node,
    rigidBodyRef,
    onHover
}: {
    node: Nodo,
    rigidBodyRef: React.RefObject<RapierRigidBody>,
    onHover: (hoverData: { node: Nodo | null, x: number, y: number }) => void
}) {
    const initialPosition = useMemo(() => new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5), []);
    const radius = useMemo(() => scalePopularity(node.popularity), [node.popularity]);

    return (
        <RigidBody ref={rigidBodyRef} restitution={0.8} position={initialPosition}>
            <Sphere
                args={[radius, 32, 32]}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    onHover({ node, x: e.clientX, y: e.clientY });
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    onHover({ node: null, x: 0, y: 0 });
                    document.body.style.cursor = 'default';
                }}
            >
                <meshStandardMaterial color={node.grupo === 0 ? 'gold' : '#c72f4e'} />
            </Sphere>
        </RigidBody>
    );
}

// (El componente LinkLine no cambia)
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


// --- MODIFICADO: Las props ahora incluyen onHover ---
interface GraphComponentProps {
    nodes: Nodo[];
    links: Arista[];
    onHover: (hoverData: { node: Nodo | null, x: number, y: number }) => void;
}

// --- COMPONENTE PRINCIPAL DEL GRAFO ---
export default function GraphComponent({ nodes, links, onHover }: GraphComponentProps) {

    // --- ELIMINADO: El estado del tooltip ya no vive aquí ---
    // const [hoverInfo, setHoverInfo] = useState(...);

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
            <Physics gravity={[0, 0, 0]} colliders="ball" damping={4}>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} />

                {nodes.map(node => (
                    <ArtistNode
                        key={node.id}
                        node={node}
                        rigidBodyRef={rigidBodyRefs[node.id]}
                        onHover={onHover} // <-- Pasamos la función que vino de las props
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

            {/* --- ELIMINADO: El tooltip ya no se renderiza aquí --- */}
        </>
    );
}