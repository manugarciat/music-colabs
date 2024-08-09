'use client'

import React, {useRef, useEffect} from 'react';
import * as d3 from 'd3';
import {Artist, Arista, Nodo} from "@/app/lib/definiciones";
import {Link, SimulationNodeDatum, zoom} from "d3";


interface GraphComponentProps {
    nodes?: Nodo[],
    links?: Arista[],
}

export default function GraphComponent({...props}: GraphComponentProps
) {
    const nodes = props.nodes
    const links = props.links
    const svgRef = useRef(null);


    useEffect(() => {
        const width = 1920;
        const height = 1080;

        const color = d3.scaleOrdinal(d3.schemeObservable10);
        const minimo = d3.min(nodes!, d => d.popularity)
        const maximo = d3.max(nodes!, d => d.popularity)
        //const hola = nodes.filter(d => d.popularity > 60)

        // const zoomHandler = zoom()
        //     .on("zoom", (e) => {
        //         console.log(e);
        //         svg.attr("transform", e.transform)
        //     });

        const rScale = d3.scalePow().exponent(2).domain([minimo!, maximo!]).range([2, 9]);

        // Crear el SVG
        const svg = d3.select(svgRef.current)
            .attr('width', "1920px")
            .attr('height', "1080px")
            // .call(zoomHandler)

        // esto lo agregué para que no se duplique:
        svg.selectAll("g").remove()

        // const zoomcontainer = svg
        //     .append("g")
        //     .call(zoomHandler)
        // svg.selectAll("circle").remove()

        // Definir la simulación
        const simulation = d3.forceSimulation(nodes as SimulationNodeDatum[])
            .force('link', d3.forceLink(links).id(d => (d as Nodo).id).distance(0))
            .force('charge', d3.forceManyBody().strength(-120))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Dibujar enlaces
        const link = svg.append('g')
            .selectAll('line')
            .data(links!)
            .join('line')
            .attr('stroke', '#a8a8a8')
            .attr('stroke-width', .5)
            .attr('opacity', 0.2)


        // Dibujar nodos
        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes!)
            .join('circle')
            .attr('r', d => rScale(d.popularity))
            .attr('fill', d => color(d.grupo))


        node.append("title").text(d => d.name);

        //creacion de tooltip
        const tooltipWidth = 140;
        const tooltipHeight = 180;

        const tooltip = svg
            .append("g")
            .attr("class", "tooltip")
            .style("opacity", 0);
        tooltip
            .append("rect")
            .attr("width", tooltipWidth)
            .attr("height", tooltipHeight)
            .attr("rx", 3)
            .attr("ry", 3)
            .attr("fill", "#333333")
            .attr("fill-opacity", 0.5);

        tooltip.append("image")
            .attr("width", tooltipWidth)
            .attr("height", tooltipWidth)

        tooltip
            .append("text")
            .text("HOLA")
            .attr("x", 2)
            .attr("y", tooltipHeight - 20)
            //.attr("text-anchor", "center")
            .attr("alignment-baseline", "middle")
            //.attr("width", tooltipWidth)
            .attr("fill", "white")
            .style("font-weight", 200)
            .style("font-size", 12);



        svg.selectAll("circle")
            .on("mouseenter", (e, d) => {
                console.log("DOM event", e);
                console.log("Attached datum", d);

                // Update the text in the tooltip
                d3.select(".tooltip text")
                    .text(d.name);
                d3.select(".tooltip image")
                    .attr("xlink:href", d.images[1].url)

                // Position the tooltip above the hovered circle
                const cx = e.target.getAttribute("cx");
                const cy = e.target.getAttribute("cy");
                // console.log(cx, cy);
                d3.select(".tooltip")
                    .attr("transform", `translate(${cx - 0.5*tooltipWidth}, ${cy - tooltipHeight -50})`)
                    .transition()
                    .duration(200)
                    .style("opacity", 1);

            })
            .on("mouseleave", (e, d) => {

                // Hide the tooltip and move it away from the chart.
                d3.select(".tooltip")
                    .transition()
                    .duration(200)
                    .style("opacity", 0)
                    //.attr("transform", `translate(0, 500)`);

            });


        node.call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded))

        // Actualizar posiciones en cada tick de la simulación
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);



        });

        // Funciones de arrastre
        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    }, [links, nodes]);

    return (
        <svg ref={svgRef}></svg>
    );
};

