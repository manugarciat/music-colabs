'use client';

import React, { useState, useMemo } from 'react';
import { Network, X, ChevronDown, ChevronUp, Users, Share2, Flame, Disc, BarChart2 } from 'lucide-react';
import { Nodo, Arista } from '@/lib/definiciones';

interface GraphMetricsProps {
    nodes: Nodo[];
    links: Arista[];
    isComputing?: boolean;
}

export default function GraphMetrics({
    nodes,
    links,
    isComputing = false
}: GraphMetricsProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Cálculos de teoría de grafos en tiempo real
    const metrics = useMemo(() => {
        const v = nodes.length;
        const e = links.length;

        if (v === 0) {
            return {
                vertices: 0,
                edges: 0,
                density: '0%',
                avgDegree: '0.0',
                topHub: null,
                totalTracks: 0,
                connectedComponents: 0
            };
        }

        // 1. Grado de cada nodo (cantidad de conexiones)
        const degreeMap = new Map<string, number>();
        let totalTracks = 0;

        links.forEach(l => {
            const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
            const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;

            degreeMap.set(sId, (degreeMap.get(sId) || 0) + 1);
            degreeMap.set(tId, (degreeMap.get(tId) || 0) + 1);

            if (l.tracks && Array.isArray(l.tracks)) {
                totalTracks += l.tracks.length;
            }
        });

        // 2. Artista más conectado (Hub central)
        let maxDegree = 0;
        let topNodeId: string | null = null;
        degreeMap.forEach((deg, id) => {
            if (deg > maxDegree) {
                maxDegree = deg;
                topNodeId = id;
            }
        });

        const topNode = nodes.find(n => n.id === topNodeId);

        // 3. Densidad: 2 * E / (V * (V - 1))
        const possibleEdges = (v * (v - 1)) / 2;
        const density = possibleEdges > 0 ? ((e / possibleEdges) * 100).toFixed(1) + '%' : '0%';

        // 4. Grado promedio: 2 * E / V
        const avgDegree = ( (2 * e) / v ).toFixed(1);

        return {
            vertices: v,
            edges: e,
            density,
            avgDegree,
            topHub: topNode ? { name: topNode.name, count: maxDegree } : null,
            totalTracks
        };
    }, [nodes, links]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-[#18181b]/80 hover:bg-[#18181b] text-white/80 hover:text-white backdrop-blur-xl border border-white/10 px-3.5 py-2.5 rounded-full transition-all shadow-xl hover:border-[#1DB954]/40 group text-xs"
                title="Ver datos y métricas del grafo"
            >
                <span className="relative flex h-2 w-2">
                    {isComputing && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isComputing ? 'bg-[#1DB954]' : 'bg-[#1DB954]/60'}`}></span>
                </span>
                <BarChart2 size={15} className="text-[#1DB954] group-hover:scale-110 transition-transform" />
                <span className="font-medium text-white/90">Métricas</span>
                <span className="text-[11px] text-white/40 pl-1">
                    {metrics.vertices} nodos · {metrics.edges} enlaces
                </span>
            </button>
        );
    }

    return (
        <div className="bg-[#18181b]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 w-[310px] shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2 text-white/90">
                    <Network size={16} className="text-[#1DB954]" />
                    <span className="text-xs font-bold uppercase tracking-wider">Topología de Red</span>
                    {isComputing && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1DB954]/20 text-[#1DB954] font-medium animate-pulse">
                            Calculando...
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                    <X size={15} />
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white/5 border border-white/5 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] uppercase font-semibold mb-1">
                        <Users size={12} className="text-[#1DB954]" />
                        <span>Artistas</span>
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">
                        {metrics.vertices}
                    </div>
                    <div className="text-[10px] text-white/40">nodos en la red</div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] uppercase font-semibold mb-1">
                        <Share2 size={12} className="text-[#00d2ff]" />
                        <span>Colabs</span>
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">
                        {metrics.edges}
                    </div>
                    <div className="text-[10px] text-white/40">conexiones activas</div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] uppercase font-semibold mb-1">
                        <Disc size={12} className="text-[#ffd700]" />
                        <span>Tracks</span>
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">
                        {metrics.totalTracks}
                    </div>
                    <div className="text-[10px] text-white/40">temas compartidos</div>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-white/50 text-[10px] uppercase font-semibold mb-1">
                        <BarChart2 size={12} className="text-brand-pink" />
                        <span>Densidad</span>
                    </div>
                    <div className="text-lg font-bold text-white tracking-tight">
                        {metrics.density}
                    </div>
                    <div className="text-[10px] text-white/40">{metrics.avgDegree} colabs / artista</div>
                </div>
            </div>

            {/* Hub Artist (Most Connected) */}
            {metrics.topHub && (
                <div className="bg-gradient-to-r from-white/[0.04] to-transparent border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5">
                    <div className="p-2 bg-[#1DB954]/10 text-[#1DB954] rounded-lg shrink-0">
                        <Flame size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-white/40 uppercase font-semibold">Nodo más conectado</div>
                        <div className="text-xs font-bold text-white truncate">{metrics.topHub.name}</div>
                    </div>
                    <span className="text-[11px] font-bold text-[#1DB954] px-2 py-0.5 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/20 shrink-0">
                        {metrics.topHub.count}
                    </span>
                </div>
            )}
        </div>
    );
}
