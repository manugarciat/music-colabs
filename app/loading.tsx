import React from 'react';

export default function Loading() {
    return (
        <main className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-[#121212] via-[#1e1e24] to-[#2a2a35] text-white flex items-center justify-center">
            <div className="bg-[#18181b]/95 border border-white/10 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4 backdrop-blur-xl">
                <div className="relative flex items-center justify-center w-16 h-16">
                    <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-[#1DB954] animate-spin"></div>
                    <div className="absolute w-10 h-10 rounded-full bg-[#1DB954]/20 blur-md animate-pulse"></div>
                    <div className="absolute w-3 h-3 rounded-full bg-[#1DB954]"></div>
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-white tracking-wide">
                        Cargando grafo musical
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed">
                        Conectando con Spotify y procesando colaboraciones...
                    </p>
                </div>

                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-gradient-to-r from-transparent via-[#1DB954] to-transparent w-full animate-pulse"></div>
                </div>
            </div>
        </main>
    );
}
