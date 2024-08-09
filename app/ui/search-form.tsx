'use client'

import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {useSearchParams, usePathname, useRouter} from 'next/navigation';


export default function SearchForm() {

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const handleSearch = (form: FormData) => {

        const params = new URLSearchParams(searchParams);
        if (form.get('artista')) {
            params.set('query', form.get('artista')!.toString());
            router.push(`${pathname}?${params.toString()}`);
        }
    }
    return (
        <form action={handleSearch}>
            <div className="flex flex-row justify-evenly text-[#000000]">
                <input
                    id="artist_input"
                    name="artista"
                    type="text"
                    placeholder="Buscar artista"
                    className="rounded-md py-2 pl-2 text-sm placeholder:text-gray-500 w-3/4 m-1"
                    aria-describedby="nombre artista"/>

                <button type="submit" className="rounded-md py-2 bg-[#efb118] p-6 m-1">
                    <MagnifyingGlassIcon className="w-4 text-[#000000]" />
                </button>
            </div>
        </form>
    )
}
