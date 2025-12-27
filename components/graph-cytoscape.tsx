// components/graph-cytoscape.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { Nodo, Arista } from '@/lib/definiciones';
import cytoscape from 'cytoscape';
// @ts-ignore
import cola from 'cytoscape-cola';

cytoscape.use(cola);

// Props que recibe el componente
interface CytoscapeGraphProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
    onHover: (hoverData: { node: any | null, x: number, y: number }) => void;
    layoutTrigger?: number;
}

export default function CytoscapeGraph({ nodes, links, onNodeClick, onHover, layoutTrigger = 0 }: CytoscapeGraphProps) {

    // --- NUEVO: Estado para guardar la instancia de Cytoscape ---
    const [cy, setCy] = useState<cytoscape.Core | null>(null);

    const elements = useMemo(() => {
        const formattedNodes = nodes.map(node => ({
            data: { ...node },
            classes: node.grupo === 0 ? 'root' : node.expanded ? 'expanded' : ''
        }));
        const formattedEdges = links.map(link => ({
            data: { source: link.source, target: link.target }
        }));
        return CytoscapeComponent.normalizeElements({ nodes: formattedNodes, edges: formattedEdges });
    }, [nodes, links]);

    const layout = useMemo(() => ({
        name: 'cola',
        animate: true,
        refresh: 1,
        infinite: false,
        ungrabifyWhileSimulating: false,
        fit: true,
        padding: 50,
        randomize: false,

        // Physics parameters for "breathing" graph
        nodeSpacing: (node: any) => 40,
        edgeLength: (edge: any) => 150,
        gravity: 0.8,
    }), []);

    // --- SOLUCIÓN 1: Re-ejecutar el layout cuando los elementos cambian ---
    useEffect(() => {
        // Si la instancia de Cytoscape existe y tenemos nodos...
        if (cy && elements.length > 0) {
            // ...le decimos que ejecute el layout de nuevo.
            cy.layout(layout).run();
        }
    }, [elements, cy, layout, layoutTrigger]); // Se dispara cada vez que llegan nuevos nodos/links o el trigger cambia

    // --- SOLUCIÓN 2: Hacer el texto dinámico y más legible ---
    const stylesheet = useMemo(() => ([
        {
            selector: 'node',
            style: {
                'background-color': '#c72f4e',
                'width': 'mapData(popularity, 0, 100, 20, 60)',
                'height': 'mapData(popularity, 0, 100, 20, 60)',
                'transition-property': 'background-color',
                'transition-duration': '0.2s',

                'label': 'data(name)',
                // --- El tamaño de la fuente ahora depende de la popularidad ---
                'font-size': 'mapData(popularity, 0, 100, 4, 8)',
                'color': '#fff', // Texto blanco
                'text-outline-width': 0.5,
                'text-outline-color': '#333', // Contorno negro para máximo contraste
                'text-valign': 'center',
                'text-halign': 'center',
                // --- Ajustes para que el texto no se salga del nodo ---
                'text-wrap': 'wrap',
                'text-max-width': '50px'
            }
        },
        {
            selector: 'edge',
            style: { 'width': 0.5, 'line-color': '#ccc', 'curve-style': 'bezier', 'opacity': 0.5 }
        },
        {
            selector: 'node:hover',
            style: { 'background-color': '#ff7f50' }
        },
        {
            selector: '.root',
            style: { 'background-color': 'gold' }
        },
        {
            selector: '.expanded',
            style: { 'background-color': '#666' }
        }
    ]), []);

    return (
        <CytoscapeComponent
            elements={elements}
            layout={{ name: 'preset' }} // Usamos un layout 'preset' inicial para que el useEffect tenga el control
            stylesheet={stylesheet}
            style={{ width: '100%', height: '100%' }}
            zoomingEnabled={true}
            userZoomingEnabled={true}
            panningEnabled={true}
            userPanningEnabled={true}
            minZoom={0.5}
            maxZoom={2}
            wheelSensitivity={0.2}
            cy={(cyInstance: cytoscape.Core) => {
                // Guardamos la instancia en el estado para poder usarla en el useEffect
                setCy(cyInstance);

                cyInstance.removeAllListeners();
                cyInstance.on('tap', 'node', (event: cytoscape.EventObject) => {
                    const node = event.target.data();
                    if (!node.expanded) onNodeClick(node.id);
                });
                cyInstance.on('mouseover', 'node', (event: cytoscape.EventObject) => {
                    const node = event.target.data();
                    const renderedPosition = event.renderedPosition;
                    onHover({ node, x: renderedPosition.x, y: renderedPosition.y });
                    const container = cyInstance.container();
                    if (container) container.style.cursor = 'pointer';
                });
                cyInstance.on('mouseout', 'node', () => {
                    onHover({ node: null, x: 0, y: 0 });
                    const container = cyInstance.container();
                    if (container) container.style.cursor = 'default';
                });
            }}
        />
    );
}