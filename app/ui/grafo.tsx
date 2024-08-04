import * as d3 from "d3";
import {svg} from "d3";

export default function LinePlot({
                                     data = {
                                         nodes: [
                                             {id: "Myriel", group: 'team1'},
                                             {id: "Anne", group: 'team1'},
                                             {id: "Napoleon", group: 'team1'},
                                         ],
                                         links: [
                                             {source: "Anne", target: "Myriel", value: 1},
                                             {source: "Napoleon", target: "Myriel", value: 1},
                                         ]
                                     },
                                     width = 640,
                                     height = 600,
                                     marginTop = 20,
                                     marginRight = 20,
                                     marginBottom = 20,
                                     marginLeft = 20
                                 }) {


    d3.forceSimulation(data.nodes) // apply the simulation to our array of nodes

        // Force #1: links between nodes
        .force('link', d3.forceLink(data.links).id((d) => d.id))

        // Force #2: avoid node overlaps
        .force('collide', d3.forceCollide().radius(10))

        // Force #3: attraction or repulsion between nodes
        .force('charge', d3.forceManyBody())

        // Force #4: nodes are attracted by the center of the chart area
        .force('center', d3.forceCenter(width / 2, height / 2));




    const x = d3.scaleLinear([0, data.length - 1], [marginLeft, width - marginRight]);
    const y = d3.scaleLinear(d3.extent(data), [height - marginBottom, marginTop]);
    const line = d3.line((d, i) => x(i), y);
    return (
        <svg width={width} height={height}>
            <path fill="none" stroke="currentColor" strokeWidth="1.5" d={line(data)}/>
            <g fill="white" stroke="currentColor" strokeWidth="1.5">
                {data.map((d, i) => (<circle key={i} cx={x(i)} cy={y(d)} r="6.5"/>))}
            </g>
        </svg>
    );
}