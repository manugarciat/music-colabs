'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
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
        <div ref={wrapperRef} className="relative w-full z-50 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 mb-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">music colabs</span>
                <img
                    src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_White.png"
                    alt="Spotify"
                    className="opacity-70 h-[21px] w-auto"
                />
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    onFocus={() => term.length > 2 && setShowDropdown(true)}
                    placeholder="Buscar artista..."
                    className="w-full bg-[#18181b]/90 backdrop-blur-md text-white border border-white/10 rounded-2xl px-4 py-2.5 pl-10 focus:outline-none focus:border-[#1DB954] focus:ring-1 focus:ring-[#1DB954] transition-all shadow-lg placeholder:text-white/20 text-sm"
                />
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />

                {loading && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-3 w-3 border-2 border-white/20 border-t-white rounded-full"></div>
                    </div>
                )}
            </div>

            {showDropdown && results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#1e1e24]/65 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
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
