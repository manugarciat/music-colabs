'use client'

import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {useSearchParams, usePathname, useRouter} from 'next/navigation';
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
            <form action={handleSearch}>
                <div className="flex flex-row justify-evenly">
                    <input
                        id="artist_input"
                        name="artista"
                        type="text"
                        placeholder="Buscar artista"
                        className="py-2 pl-2 text-sm w-3/4 m-1 bg-input rounded-md"
                        aria-describedby="nombre artista"/>

                    <button type="submit"
                            className="py-2 p-6 m-1 bg-primary rounded-md text-primary-foreground hover:bg-primary/90 transition-colors">
                        <MagnifyingGlassIcon className="w-4 "/>
                    </button>
                </div>
            </form>
            <Switch
                id="toggle-mode"
                checked={isChecked}
                onCheckedChange={setIsChecked}/></>
    )
}
