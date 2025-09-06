// components/graph-cytoscape.tsx
'use client'

import React, { useEffect, useState, useMemo } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { Nodo, Arista } from '@/lib/definiciones';
import cytoscape from 'cytoscape';

// Props que recibe el componente
interface CytoscapeGraphProps {
    nodes: Nodo[];
    links: Arista[];
    onNodeClick: (nodeId: string) => void;
    onHover: (hoverData: { node: any | null, x: number, y: number }) => void;
}

export default function CytoscapeGraph({ nodes, links, onNodeClick, onHover }: CytoscapeGraphProps) {

    const elements = useMemo(() => {
        const formattedNodes = nodes.map(node => ({
            data: {
                // --- CORRECCIÓN: Usar el spread operator directamente ---
                // Esto elimina las propiedades duplicadas 'id' y 'popularity'
                ...node
            },
            classes: node.grupo === 0 ? 'root' : node.expanded ? 'expanded' : ''
        }));

        const formattedEdges = links.map(link => ({
            data: {
                source: link.source,
                target: link.target
            }
        }));

        return [...formattedNodes, ...formattedEdges];
    }, [nodes, links]);


    // --- CORRECCIÓN: Usar las opciones correctas para el layout 'cose' ---
    // Envolvemos en useMemo para que el objeto no se re-cree en cada render
    const layout = useMemo(() => ({
        name: 'cose',
        animate: false, // <-- Desactivar animación durante el hover ayuda mucho
        fit: true,
        padding: 50,
        nodeRepulsion: 4500,
        gravity: 0.1,
    }), []);

    const stylesheet = useMemo(() => ([
        {
            selector: 'node',
            style: {
                'background-color': '#c72f4e',
                'label': 'data(label)',
                'width': 'mapData(popularity, 0, 100, 20, 60)',
                'height': 'mapData(popularity, 0, 100, 20, 60)',
                'font-size': '12px',
                'color': '#fff',
                'text-valign': 'center',
                'transition-property': 'background-color',
                'transition-duration': '0.2s'
            }
        },
        {
            selector: 'edge',
            style: { 'width': 2, 'line-color': '#ccc', 'curve-style': 'bezier' }
        },
        {
            selector: 'node:hover',
            style: { 'background-color': '#ff7f50' } // Estilo para el hover
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
            layout={layout}
            stylesheet={stylesheet}
            style={{ width: '100%', height: '100%' }}
            // --- CORRECCIÓN: Tipar 'cy' y 'event' ---
            cy={(cy: cytoscape.Core) => {
                cy.removeAllListeners();
                cy.on('tap', 'node', (event: cytoscape.EventObject) => {
                    const node = event.target.data();
                    if (!node.expanded) {
                        onNodeClick(node.id);
                    }
                });
                cy.on('mouseover', 'node', (event: cytoscape.EventObject) => {
                    const node = event.target.data();
                    const renderedPosition = event.renderedPosition;
                    onHover({ node, x: renderedPosition.x, y: renderedPosition.y });
                    cy.container().style.cursor = 'pointer';
                });
                cy.on('mouseout', 'node', () => {
                    onHover({ node: null, x: 0, y: 0 });
                    cy.container().style.cursor = 'default';
                });
            }}
        />
    );
}