'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Artist } from '@/lib/definiciones';

export default function DebouncedSearch() {
    const router = useRouter();
    const [term, setTerm] = useState('');
    const [results, setResults] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (term.length > 2) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/search-proxy?q=${encodeURIComponent(term)}`);
                    const data = await res.json();
                    setResults(data.artists || []);
                    setShowDropdown(true);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [term]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (artist: Artist) => {
        // Navigate by ID for precision
        router.push(`/?id=${artist.id}`); // This requires page.tsx update
        setShowDropdown(false);
        setTerm(''); // Optional: clear or keep name
    };

    return (
        <div ref={wrapperRef} className="w-full relative z-50">
            <div className="relative">
                <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onFocus={() => term.length > 2 && setShowDropdown(true)}
                    placeholder="Buscar artista..."
                    className="w-full pl-4 pr-12 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 focus:border-white/30 focus:ring-0 text-white placeholder-white/50 outline-none transition-all shadow-inner"
                />
                <div className="absolute right-3 top-3 text-white/50">
                    {loading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full"></div>
                    ) : (
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    )}
                </div>
            </div>

            {showDropdown && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#1e1e24]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto">
                    {results.map((artist) => (
                        <button
                            key={artist.id}
                            onClick={() => handleSelect(artist)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
                        >
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-black/50 flex-shrink-0">
                                {artist.images?.[0] ? (
                                    <Image
                                        src={artist.images[0].url}
                                        alt={artist.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-white/30">?</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{artist.name}</h4>
                                <div className="flex items-center gap-2 text-xs text-white/50">
                                    <span>Pop: {artist.popularity}%</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
