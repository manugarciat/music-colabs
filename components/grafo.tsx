'use client'

import React, {useRef, useEffect, useState} from 'react';
import Image from 'next/image';
import * as d3 from 'd3';
import {Arista, Nodo, Grafo} from "@/lib/definiciones";

// --- INTERFACES ---
interface Dimensions {
    width: number;
    height: number;
}
interface TooltipData {
    x: number;
    y: number;
    visible: boolean;
    node: Nodo | null;
}
interface GraphComponentProps {
    nodes?: Nodo[],
    links?: Arista[],
}

// --- COMPONENTE PRINCIPAL ---
export default function GraphComponent(props: GraphComponentProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // --- ESTADO Y REFS ---
    // 1. El estado del grafo ahora vive aquí, en el cliente.
    const [graphData, setGraphData] = useState<Grafo>({ nodes: [], links: [] });

    // 2. Guardamos la simulación en una ref para poder actualizarla sin recrearla.
    const simulationRef = useRef<d3.Simulation<Nodo, Arista>>();

    // Estados para las dimensiones y el tooltip (sin cambios)
    const [dimensions, setDimensions] = useState<Dimensions | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({x: 0, y: 0, visible: false, node: null});

    // --- EFECTOS ---
    // Efecto para inicializar el grafo con los datos que vienen del servidor (props)
    useEffect(() => {
        if (props.nodes && props.links) {
            // Añadimos una propiedad 'expanded' a cada nodo para saber si ya lo hemos explorado.
            // El nodo principal (grupo 0) se marca como ya expandido.
            const initialNodes = props.nodes.map(n => ({
                ...n,
                expanded: n.grupo === 0
            }));
            setGraphData({ nodes: initialNodes, links: props.links });
        }
    }, [props.nodes, props.links]);

    // Efecto para medir el contenedor (sin cambios)
    useEffect(() => {
        if (containerRef.current) {
            const observer = new ResizeObserver(entries => {
                if (entries[0] && entries[0].contentRect) {
                    setDimensions({
                        width: entries[0].contentRect.width,
                        height: entries[0].contentRect.height
                    });
                }
            });
            observer.observe(containerRef.current);
            return () => observer.disconnect();
        }
    }, []);

    // --- FUNCIÓN DE EXPANSIÓN ---
    const handleNodeClick = async (node: Nodo) => {
        // No hacemos nada si el nodo ya fue expandido
        if (node.expanded) {
            console.log(`El nodo ${node.name} ya ha sido expandido.`);
            return;
        }

        node.fx = node.x;
        node.fy = node.y;
        console.log(`Expandiendo ${node.name}...`);

        // Marcamos el nodo como expandido en la UI inmediatamente
        setGraphData(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === node.id ? { ...n, expanded: true, fx: n.x, fy: n.y } : n)
        }));

        try {
            const response = await fetch(`/api/collabs/${node.id}`);
            const { newNodes, newLinks } = await response.json();

            // Fusionamos los nuevos datos con el grafo existente
            setGraphData(prev => {
                const existingNodeIds = new Set(prev.nodes.map(n => n.id));

                // Añadimos solo los nodos que no existen
                const uniqueNewNodes = newNodes
                    .filter((n: Nodo) => !existingNodeIds.has(n.id))
                    .map((n: Nodo) => ({ ...n, expanded: false, grupo: 2 })); // Los marcamos como no expandidos y del grupo 2

                return {
                    nodes: [...prev.nodes, ...uniqueNewNodes],
                    links: [...prev.links, ...newLinks]
                };
            });
        } catch (error) {
            console.error("Error al expandir el nodo:", error);
        }
    };

    // --- EFECTO PRINCIPAL DE D3 (INICIALIZACIÓN Y ACTUALIZACIÓN) ---
    useEffect(() => {
        if (!canvasRef.current || !dimensions || graphData.nodes.length === 0) return;

        const { width, height } = dimensions;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Configuración de canvas y escalas (sin cambios)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.scale(dpr, dpr);
        const color = d3.scaleOrdinal(d3.schemeTableau10);
        const rScale = d3.scalePow().exponent(2).domain([0, 100]).range([3, 16]);

        // INICIALIZACIÓN (solo se ejecuta la primera vez)
        if (!simulationRef.current) {
            // Creamos la simulación y la guardamos en la ref
            simulationRef.current = d3.forceSimulation<Nodo>()
                .force('link', d3.forceLink<Nodo, Arista>().id((d: any) => d.id).distance(50))
                .force('charge', d3.forceManyBody().strength(-200))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collide', d3.forceCollide<Nodo>(d => rScale(d.popularity) + 5));

            // Añadimos los manejadores de eventos al canvas (una sola vez)
            const d3Canvas = d3.select(canvas);

            // Click para expandir
            d3Canvas.on('click', (event) => {
                const simulation = simulationRef.current;
                if (!simulation) return;
                const [x, y] = d3.pointer(event);
                const node = simulation.find(x, y, 20);
                if (node) {
                    handleNodeClick(node);
                }
            });

            // Arrastrar nodos (drag)
            d3Canvas.call(d3.drag<HTMLCanvasElement, unknown, Nodo | undefined>()
                .container(canvas)
                .subject((event) => simulationRef.current?.find(event.x, event.y, 20))
                .on('start', (event) => {
                    if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
                    if (event.subject) {
                        event.subject.fx = event.subject.x;
                        event.subject.fy = event.subject.y;
                    }
                })
                .on('drag', (event) => {
                    if (event.subject) {
                        event.subject.fx = event.x;
                        event.subject.fy = event.y;
                    }
                })
                .on('end', (event) => {
                    if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
                    if (event.subject) {
                        event.subject.fx = null;
                        event.subject.fy = null;
                    }
                })
            );

            // Tooltip (mousemove y mouseleave)
            d3Canvas
                .on('mousemove', (event) => {
                    const simulation = simulationRef.current;
                    if (!simulation) return;
                    const [x, y] = d3.pointer(event);
                    const node = simulation.find(x, y, 20);
                    setTooltip({ visible: !!node, node: node || null, x: event.pageX, y: event.pageY });
                })
                .on('mouseleave', () => setTooltip(prev => ({...prev, visible: false})));
        }

        // ACTUALIZACIÓN (se ejecuta cada vez que cambian los datos o dimensiones)
        const simulation = simulationRef.current;
        simulation.force('center', d3.forceCenter(width / 2, height / 2));

        // 1. Actualizamos la simulación con los nuevos datos del estado
        simulation.nodes(graphData.nodes);
        // (simulation.force('link') as d3.ForceLink<Nodo, Arista>).links(graphData.links);
        (simulation.force('link') as d3.ForceLink<Nodo, Arista>).links(JSON.parse(JSON.stringify(graphData.links)));

        // 2. Le damos un "empujón" para que se reacomode con los nuevos nodos
        simulation.alpha(0.3).restart();

        // 3. La función de dibujo ahora lee directamente del estado `graphData`
        function ticked() {
            if (!context) return;
            context.clearRect(0, 0, width, height);

            context.strokeStyle = '#a8a8a8';
            context.globalAlpha = 0.4;
            context.beginPath();

            const linksToDraw = (simulation.force('link') as d3.ForceLink<Nodo, Arista>).links();
            linksToDraw.forEach(link => {
                const source = link.source as any;
                const target = link.target as any;
                context.moveTo(source.x, source.y);
                context.lineTo(target.x, target.y);
            });
            context.stroke();
            context.globalAlpha = 1.0;

            graphData.nodes.forEach(node => {
                context.beginPath();
                context.moveTo((node.x || 0) + rScale(node.popularity), node.y || 0);
                context.arc(node.x || 0, node.y || 0, rScale(node.popularity * 1.5), 0, 2 * Math.PI);
                context.fillStyle = color(node.genres[0] || 'default'); //por genero
                context.fill();
            });
        }

        simulation.on('tick', ticked);

    }, [graphData, dimensions]);

    // --- JSX ---
    return (
        <div ref={containerRef} className="w-full h-full">
            <canvas ref={canvasRef} />
            {tooltip.visible && tooltip.node && (
                <div
                    className="graph-tooltip"
                    style={{
                        opacity: 1,
                        position: 'absolute',
                        top: `${tooltip.y + 15}px`,
                        left: `${tooltip.x + 15}px`,
                    }}
                >
                    {tooltip.node.images[1] && (
                        <Image
                            src={tooltip.node.images[1].url}
                            alt={tooltip.node.name}
                            width={tooltip.node.images[1].width}
                            height={tooltip.node.images[1].height}
                        />
                    )}
                    <strong>{tooltip.node.name}</strong>
                    <p>Popularidad: {tooltip.node.popularity}</p>
                    <p>Género: {tooltip.node.genres[0]}</p>
                </div>
            )}
        </div>
    );
};