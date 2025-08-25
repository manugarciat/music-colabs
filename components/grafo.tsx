'use client'

import React, {useRef, useMemo, useEffect} from 'react'
import {useFrame} from '@react-three/fiber'
import {Sphere, Line, MapControls} from '@react-three/drei'
import {Physics, RigidBody, RapierRigidBody, BallCollider} from '@react-three/rapier'
import * as THREE from 'three'
import {Nodo, Arista} from "@/lib/definiciones";
import {Line2} from 'three/examples/jsm/lines/Line2.js';

// --- HELPER: Función para escalar la popularidad a un radio visible ---
const scalePopularity = (popularity: number) => {
    const minRadius = 0.4;
    const maxRadius = 1.5;
    return minRadius + (maxRadius - minRadius) * (popularity / 100);
}

// --- COMPONENTE PARA UN SOLO NODO ---
function ArtistNode({
                        node,
                        rigidBodyRef,
                        onHover,
                        onNodeClick
                    }: {
    node: Nodo,
    rigidBodyRef: React.RefObject<RapierRigidBody>,
    onHover: (hoverData: { node: Nodo | null, x: number, y: number }) => void,
    onNodeClick: (nodeId: string) => void
}) {
    // --- CAMBIO 1: Posición inicial siempre en Z=0 ---
    const initialPosition = useMemo(() => new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, 0), []);
    const radius = useMemo(() => scalePopularity(node.popularity), [node.popularity]);

    // --- CAMBIO 2: Bloquear el movimiento en el eje Z ---
    useEffect(() => {
        // Una vez que el cuerpo físico existe, le aplicamos el bloqueo
        if (rigidBodyRef.current) {
            // Permitir traslación en X e Y, pero no en Z
            rigidBodyRef.current.setEnabledTranslations(true, true, false, true);
            // Bloquear rotación en todos los ejes
            rigidBodyRef.current.setEnabledRotations(false, false, false, true);
        }
    }, [rigidBodyRef]);

    return (
        <RigidBody
            ref={rigidBodyRef}
            restitution={0.2}
            position={initialPosition}
            colliders={false}
        >
            <BallCollider args={[radius * 1.5]} />
            <Sphere
                args={[radius, 32, 32]}
                onPointerOver={(e) => { e.stopPropagation(); onHover({ node, x: e.clientX, y: e.clientY }); document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { onHover({ node: null, x: 0, y: 0 }); document.body.style.cursor = 'default'; }}
                onClick={() => { if (!node.expanded) onNodeClick(node.id); }}
            >
                <meshStandardMaterial color={node.grupo === 0 ? 'gold' : node.expanded ? '#666' : '#c72f4e'} />
            </Sphere>
        </RigidBody>
    );
}

// --- COMPONENTE PARA LA LÍNEA VISUAL ---
function LinkLine({sourceRef, targetRef}: {
    sourceRef: React.RefObject<RapierRigidBody>,
    targetRef: React.RefObject<RapierRigidBody>
}) {
    // --- CORREGIDO: Usar el tipo Line2 para la ref ---
    const lineRef = useRef<Line2>(null!);
    const points = useMemo(() => [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)], []);

    useFrame(() => {
        if (sourceRef.current && targetRef.current) {
            const sourcePos = sourceRef.current.translation();
            const targetPos = targetRef.current.translation();
            points[0].set(sourcePos.x, sourcePos.y, sourcePos.z);
            points[1].set(targetPos.x, targetPos.y, targetPos.z);

            // La geometría de una Line2 es diferente, se actualiza así
            if (lineRef.current) {
                lineRef.current.geometry.setPositions([...points[0].toArray(), ...points[1].toArray()]);
            }
        }
    });

    return <Line ref={lineRef} points={points} color="black" lineWidth={1} transparent opacity={0.8}/>;
}

// --- COMPONENTE INVISIBLE PARA LAS FÍSICAS DE LAS ARISTAS (RESORTES) ---
function LinkForces({links, refs}: { links: Arista[], refs: { [key: string]: React.RefObject<RapierRigidBody> } }) {
    const restLength = 8;    // La distancia ideal que queremos entre nodos conectados
    const stiffness = 0.2;   // La "fuerza" del resorte

    useFrame(() => {
        links.forEach(link => {
            const sourceRef = refs[link.source as string];
            const targetRef = refs[link.target as string];

            if (sourceRef?.current && targetRef?.current) {
                const sourcePos = sourceRef.current.translation();
                const targetPos = targetRef.current.translation();

                const sourceVec = new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
                const targetVec = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z);

                const direction = targetVec.clone().sub(sourceVec);
                const distance = direction.length();
                if (distance === 0) return;
                const displacement = distance - restLength;

                const force = direction.normalize().multiplyScalar(displacement * stiffness * 0.01);

                sourceRef.current.applyImpulse(force, true);
                targetRef.current.applyImpulse(force.negate(), true);
            }
        });
    });

    return null;
}

// --- COMPONENTE INVISIBLE PARA LA FUERZA CENTRAL (GRAVEDAD) ---
function CenterForce({refs}: { refs: { [key: string]: React.RefObject<RapierRigidBody> } }) {
    const strength = 0.3; // Fuerza de atracción hacia el centro

    useFrame((_, delta) => {
        for (const ref of Object.values(refs)) {
            if (ref.current) {
                const position = ref.current.translation();
                const force = new THREE.Vector3(-position.x, -position.y, -position.z).multiplyScalar(strength * delta);
                ref.current.applyImpulse(force, true);
            }
        }
    });

    return null;
}

// --- PROPS PARA EL COMPONENTE PRINCIPAL ---
interface GraphComponentProps {
    nodes: Nodo[];
    links: Arista[];
    onHover: (hoverData: { node: Nodo | null, x: number, y: number }) => void;
    onNodeClick: (nodeId: string) => void;
}

// --- COMPONENTE PRINCIPAL DEL GRAFO ---
export default function GraphComponent({ nodes, links, onHover, onNodeClick }: GraphComponentProps) {

    const rigidBodyRefs = useRef<{ [key: string]: React.RefObject<RapierRigidBody> }>({});

    // --- ¡CLAVE DE LA SOLUCIÓN! ---
    // Sincronizamos las refs aquí, en el cuerpo del componente.
    // Esto se ejecuta en cada render, ANTES de que los hijos se rendericen.
    nodes.forEach(node => {
        if (!rigidBodyRefs.current[node.id]) {
            rigidBodyRefs.current[node.id] = React.createRef<RapierRigidBody>();
        }
    });

    return (
        <>
            <MapControls enableRotate={false} />
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} />
            <Physics gravity={[0, 0, 0]}>
                {nodes.map(node => (
                    <ArtistNode
                        key={node.id}
                        node={node}
                        rigidBodyRef={rigidBodyRefs.current[node.id]}
                        onHover={onHover}
                        onNodeClick={onNodeClick}
                    />
                ))}

                {links.map((link, index) => {
                    const sourceRef = rigidBodyRefs.current[link.source as string];
                    const targetRef = rigidBodyRefs.current[link.target as string];
                    return sourceRef && targetRef ? <LinkLine key={`${link.source}-${link.target}-${index}`} sourceRef={sourceRef} targetRef={targetRef} /> : null;
                })}

                <LinkForces links={links} refs={rigidBodyRefs.current} />
                <CenterForce refs={rigidBodyRefs.current} />
            </Physics>
        </>
    );
}