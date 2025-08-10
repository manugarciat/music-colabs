'use client'

import React, {useRef, useEffect, useState} from 'react';
import * as d3 from 'd3';
import {Arista, Nodo} from "@/lib/definiciones";
import Image from 'next/image';

interface Dimensions {
    width: number;
    height: number;
}

interface GraphComponentProps {
    nodes?: Nodo[],
    links?: Arista[],
}

interface TooltipData {
    x: number;
    y: number;
    visible: boolean;
    node: Nodo | null;
}

export default function GraphComponent({...props}: GraphComponentProps) {
    const {nodes, links} = props;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData>({x: 0, y: 0, visible: false, node: null});

    // 1. Referencia para el div contenedor que vamos a medir
    const containerRef = useRef<HTMLDivElement | null>(null);

    // 2. Estado para guardar las dimensiones del contenedor
    const [dimensions, setDimensions] = useState<Dimensions | null>(null);

    // 3. Este useEffect se encarga de medir el contenedor
    useEffect(() => {
        if (containerRef.current) {
            const observer = new ResizeObserver(entries => {
                // Actualizamos el estado con las nuevas dimensiones
                if (entries[0] && entries[0].contentRect) {
                    setDimensions({
                        width: entries[0].contentRect.width,
                        height: entries[0].contentRect.height
                    });
                }
            });
            // Empezamos a observar el contenedor
            observer.observe(containerRef.current);
            // IMPORTANTE: Limpiamos el observador cuando el componente se desmonte
            return () => observer.disconnect();
        }
    }, []);

    useEffect(() => {
        if (!nodes || !links || !canvasRef.current || !dimensions) return;

        const { width, height } = dimensions;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) {
            console.error("No se pudo obtener el contexto 2D del canvas");
            return;
        }

        // Configuración para pantallas de alta densidad (Retina)
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.scale(dpr, dpr);

        const color = d3.scaleOrdinal(d3.schemeTableau10);
        const minimo = d3.min(nodes, d => d.popularity) || 0;
        const maximo = d3.max(nodes, d => d.popularity) || 100;
        const rScale = d3.scalePow().exponent(2).domain([minimo, maximo]).range([3, 16]);

        const simulation = d3.forceSimulation<Nodo>(nodes)
            .force('link', d3.forceLink<Nodo, Arista>(links).id((d: any) => d.id).distance(40))
            .force('charge', d3.forceManyBody().strength(-180))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide<Nodo>(d => rScale(d.popularity) + 4))
            .alphaMin(0.01);

        function ticked() {
            if (context && links && nodes) {
                context.clearRect(0, 0, width, height);

                context.strokeStyle = '#a8a8a8';
                context.globalAlpha = 0.2;
                context.beginPath();
                links.forEach(link => {
                    const source = link.source as any;
                    const target = link.target as any;
                    context.moveTo(source.x, source.y);
                    context.lineTo(target.x, target.y);
                });
                context.stroke();
                context.globalAlpha = 1.0;

                nodes.forEach(node => {
                    context.beginPath();
                    context.moveTo((node.x || 0) + rScale(node.popularity), node.y || 0);
                    context.arc(node.x || 0, node.y || 0, rScale(node.popularity), 0, 2 * Math.PI);
                    context.fillStyle = color(String(node.grupo));
                    context.fill();
                });
            }
        }

        simulation.on('tick', ticked);

        // Solución al segundo error: Tipado explícito para d3.drag
        const dragBehavior = d3.drag<HTMLCanvasElement, unknown, Nodo | undefined>()
            .container(canvas)
            .subject((event) => {
                // simulation.find puede devolver undefined, el tipo del subject es Nodo | undefined
                return simulation.find(event.x, event.y, 12);
            })
            .on('start', (event) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                // Comprobamos que de verdad hemos encontrado un nodo
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
                if (!event.active) simulation.alphaTarget(0);
                if (event.subject) {
                    event.subject.fx = null;
                    event.subject.fy = null;
                }
            });

        // Aplicamos el comportamiento de drag al canvas
        d3.select(canvas).call(dragBehavior);

        d3.select(canvas)
            .on('mousemove', (event) => {
                const [x, y] = d3.pointer(event);
                const node = simulation.find(x, y, 12); // Busca un nodo en un radio de 30px

                setTooltip({
                    visible: !!node, // visible es true si encontramos un nodo, si no, es false
                    node: node || null,
                    x: event.pageX, // Usamos pageX/Y para la posición absoluta del div
                    y: event.pageY
                });
            })
            .on('mouseleave', () => {
                // Ocultamos el tooltip cuando el ratón sale del canvas
                setTooltip((prev: any) => ({...prev, visible: false}));
            });

    }, [links, nodes, dimensions]);

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
                </div>
            )}
        </div>
    );
};