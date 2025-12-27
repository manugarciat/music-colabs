'use client'

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch"
import React from "react";


export default function SearchForm() {

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const [isChecked, setIsChecked] = React.useState(false)

    const handleSearch = (form: FormData) => {

        const params = new URLSearchParams(searchParams);
        if (form.get('artista')) {
            params.set('query', form.get('artista')!.toString());
            router.push(`${pathname}?${params.toString()}`);
        }
    }
    return (
        <>
            <form action={handleSearch} className="w-full relative">
                <div className="flex flex-row justify-evenly w-full">
                    <input
                        id="artist_input"
                        name="artista"
                        type="text"
                        placeholder="Buscar artista"
                        className="w-full pl-4 pr-12 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 focus:border-white/30 focus:ring-0 text-white placeholder-white/50 outline-none transition-all shadow-inner"
                        aria-describedby="nombre artista" />

                    <button type="submit"
                        className="absolute right-1 top-1 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </>
    )
}
