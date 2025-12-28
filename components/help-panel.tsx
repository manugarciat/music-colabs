'use client';

import React, { useState } from 'react';
import {
    Move3d,
    ZoomIn,
    MousePointerClick,
    Music,
    Info,
    X
} from 'lucide-react';

export default function HelpPanel() {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-white/5 hover:bg-black/80 text-white/70 hover:text-white backdrop-blur-md border border-white/10 p-2.5 rounded-full transition-all shadow-lg group"
                title="Ayuda de navegación"
            >
                <Info size={20} className="group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-[280px] shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2 text-white/90">
                    <Info size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Controles</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/50 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex flex-col gap-3">
                <Item
                    icon={<Move3d size={16} />}
                    label="Orbitar"
                    desc="Drag con mouse / Dedo"
                />
                <Item
                    icon={<ZoomIn size={16} />}
                    label="Zoom"
                    desc="Scroll / Pellizcar"
                />
                <Item
                    icon={<MousePointerClick size={16} />}
                    label="Explorar"
                    desc="Click en Nodos para expandir"
                />
                <Item
                    icon={<Music size={16} />}
                    label="Escuchar"
                    desc="Click en Conexiones para oír"
                />
            </div>
        </div>
    );
}

function Item({ icon, label, desc }: { icon: React.ReactNode, label: string, desc: string }) {
    return (
        <div className="flex items-start gap-3 text-sm">
            <div className="p-1.5 bg-white/5 rounded-lg text-[#1DB954] mt-0.5">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="font-medium text-white/90">{label}</span>
                <span className="text-xs text-white/50">{desc}</span>
            </div>
        </div>
    );
}
