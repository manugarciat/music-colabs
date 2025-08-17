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
    const [graphData, setGraphData] = useState<Grafo>({ nodes: [], links: [] });
    const simulationRef = useRef<d3.Simulation<Nodo, Arista>>();
    const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
    const zoomRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown>>();

    // Estados para las dimensiones y el tooltip
    const [dimensions, setDimensions] = useState<Dimensions | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({x: 0, y: 0, visible: false, node: null});
    const [cursor, setCursor] = useState<string>('grab');

    // --- EFECTOS ---
    // Efecto para inicializar el grafo con los datos del servidor
    useEffect(() => {
        if (props.nodes && props.links) {
            const initialNodes = props.nodes.map(n => ({
                ...n,
                expanded: n.grupo === 0
            }));
            setGraphData({ nodes: initialNodes, links: props.links });
        }
    }, [props.nodes, props.links]);

    // Efecto para medir el contenedor
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
        if (node.expanded) {
            console.log(`El nodo ${node.name} ya ha sido expandido.`);
            return;
        }

        console.log(`Expandiendo ${node.name}...`);
        setGraphData(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === node.id ? { ...n, expanded: true } : n)
        }));

        try {
            const response = await fetch(`/api/collabs/${node.id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const { newNodes, newLinks } = await response.json();

            setGraphData(prev => {
                const existingNodeIds = new Set(prev.nodes.map(n => n.id));
                const uniqueNewNodes = newNodes
                    .filter((n: Nodo) => !existingNodeIds.has(n.id))
                    .map((n: Nodo) => ({
                        ...n,
                        expanded: false,
                        grupo: 2,
                        x: node.x,
                        y: node.y
                    }));

                return {
                    nodes: [...prev.nodes, ...uniqueNewNodes],
                    links: [...prev.links, ...newLinks]
                };
            });
        } catch (error) {
            console.error("Error al expandir el nodo:", error);
            setGraphData(prev => ({
                ...prev,
                nodes: prev.nodes.map(n => n.id === node.id ? { ...n, expanded: false } : n)
            }));
        }
    };

    // --- EFECTO PRINCIPAL DE D3 ---
    useEffect(() => {
        if (!canvasRef.current || !dimensions || graphData.nodes.length === 0) return;

        const { width, height } = dimensions;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.scale(dpr, dpr);
        const color = d3.scaleOrdinal(d3.schemeTableau10);
        const rScale = d3.scalePow().exponent(2).domain([0, 100]).range([3, 16]);
        const d3Canvas = d3.select(canvas);

        const ticked = () => {
             if (!context) return;
            const transform = transformRef.current;

            context.save();
            context.clearRect(0, 0, width, height);
            context.translate(transform.x, transform.y);
            context.scale(transform.k, transform.k);

            context.strokeStyle = '#a8a8a8';
            context.globalAlpha = 0.4;
            context.lineWidth = 1 / transform.k;
            context.beginPath();
            (simulationRef.current?.force('link') as d3.ForceLink<Nodo, Arista>).links().forEach(link => {
                const source = link.source as unknown as Nodo;
                const target = link.target as unknown as Nodo;
                if(source.x && source.y && target.x && target.y){
                    context.moveTo(source.x, source.y);
                    context.lineTo(target.x, target.y);
                }
            });
            context.stroke();

            context.globalAlpha = 1.0;
            graphData.nodes.forEach(node => {
                if (node.x == null || node.y == null) return;
                const radius = rScale(node.popularity * 1.3);
                context.beginPath();
                context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
                context.fillStyle = color(node.genres[0] || 'default');
                context.fill();

                if (node.expanded) {
                    context.strokeStyle = '#333';
                    context.lineWidth = Math.max(1, 2 / transform.k);
                    context.stroke();
                }
            });

            context.restore();
        };

        // INICIALIZACIÓN (solo la primera vez)
        if (!simulationRef.current) {
            simulationRef.current = d3.forceSimulation<Nodo>()
                .force('charge', d3.forceManyBody().strength(-400))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('collide', d3.forceCollide<Nodo>(d => rScale(d.popularity) + 5))
                .on('tick', ticked);

            // SOLUCIÓN: Añadir una fuerza de enlace vacía y configurarla.
            // Los datos se añadirán más adelante, en la sección de ACTUALIZACIÓN.
            simulationRef.current.force('link', d3.forceLink<Nodo, Arista>().id((d: any) => d.id).distance(70));


            const findNode = (event: any): Nodo | undefined => {
                const simulation = simulationRef.current;
                if (!simulation) return undefined;
                const [canvasX, canvasY] = d3.pointer(event, canvas);
                const transform = transformRef.current;
                const x = transform.invertX(canvasX);
                const y = transform.invertY(canvasY);
                return simulation.find(x, y, 20 / transform.k);
            };

            zoomRef.current = d3.zoom<HTMLCanvasElement, unknown>()
                .scaleExtent([0.1, 10])
                .filter(event => {
                    return event.type === 'wheel' || (event.type === 'mousedown' && !findNode(event));
                })
                .on('zoom', (event) => {
                    transformRef.current = event.transform;
                    ticked();
                });
            d3Canvas.call(zoomRef.current);

            const dragBehavior = d3.drag<HTMLCanvasElement, Nodo>()
                .subject(event => findNode(event) as any)
                .on('start', (event) => {
                    if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                    setCursor('grabbing');
                })
                .on('drag', (event) => {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                })
                .on('end', (event) => {
                    if (!event.active) simulationRef.current?.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                    setCursor(findNode(event) ? 'pointer' : 'grab');
                });
            d3Canvas.call(dragBehavior as any);

            d3Canvas
                .on('mousemove', (event) => {
                    if (event.defaultPrevented) return;
                    const node = findNode(event);
                    setTooltip({
                        visible: !!node,
                        node: node || null,
                        x: event.pageX,
                        y: event.pageY
                    });
                    if (d3.select(event.target).style('cursor') !== 'grabbing') {
                       setCursor(node ? 'pointer' : 'grab');
                    }
                })
                .on('click', (event) => {
                    if (event.defaultPrevented) return;
                    const node = findNode(event);
                    if (node) {
                        handleNodeClick(node).then(r => r);
                    }
                })
                .on('mouseleave', () => {
                   setTooltip(prev => ({...prev, visible: false}));
                });
        }

        // ACTUALIZACIÓN (se ejecuta cada vez, incluida la primera)
        const simulation = simulationRef.current;
        simulation.force('center', d3.forceCenter(width / 2, height / 2));

        // SOLUCIÓN: Actualizar siempre los nodos PRIMERO
        simulation.nodes(graphData.nodes);

        // SOLUCIÓN: Y los enlaces DESPUÉS
        (simulation.force('link') as d3.ForceLink<Nodo, Arista>).links(graphData.links);

        simulation.alpha(0.3).restart();

    }, [graphData, dimensions]);


    // --- HELPERS PARA BOTONES DE ZOOM ---
    const zoomIn = () => {
        if (!canvasRef.current || !zoomRef.current) return;
        d3.select(canvasRef.current)
            .transition().duration(300)
            .call(zoomRef.current.scaleBy, 1.5);
    };

    const zoomOut = () => {
        if (!canvasRef.current || !zoomRef.current) return;
        d3.select(canvasRef.current)
            .transition().duration(300)
            .call(zoomRef.current.scaleBy, 0.7);
    };

    const resetZoom = () => {
        if (!canvasRef.current || !zoomRef.current) return;
        d3.select(canvasRef.current)
            .transition().duration(500)
            .call(zoomRef.current.transform, d3.zoomIdentity);
    };

    // --- JSX ---
    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas
                ref={canvasRef}
                style={{ cursor: cursor }}
            />

            <div className="absolute top-4 right-4 flex flex-col gap-2 bg-black/20 backdrop-blur-sm rounded-lg p-2">
                <button className="px-3 py-1 bg-white/80 hover:bg-white/90 rounded text-sm font-medium transition-colors" onClick={zoomIn}>+</button>
                <button className="px-3 py-1 bg-white/80 hover:bg-white/90 rounded text-sm font-medium transition-colors" onClick={zoomOut}>-</button>
                <button className="px-2 py-1 bg-white/80 hover:bg-white/90 rounded text-xs font-medium transition-colors" onClick={resetZoom}>Reset</button>
            </div>

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