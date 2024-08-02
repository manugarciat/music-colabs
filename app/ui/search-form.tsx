'use client'

import {MagnifyingGlassIcon} from "@heroicons/react/24/outline";
import {useSearchParams, usePathname, useRouter} from 'next/navigation';


export default function SearchForm() {

    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const handleSearch = (term: FormData) => {

        const params = new URLSearchParams(searchParams);
        params.set('query', term.get('artista')!.toString());
        router.push(`${pathname}?${params.toString()}`);
    }
    return (
        <form action={handleSearch}>
            <div className="flex flex-row justify-evenly">
                <input
                    id="artista"
                    name="artista"
                    type="text"
                    placeholder="buscar artista"
                    className="rounded-md py-2 pl-2 text-sm placeholder:text-gray-500 w-3/4 m-1"
                    aria-describedby="nombre artista"/>

                <button type="submit" className="rounded-md py-2 bg-amber-200 p-6 m-1">
                    <MagnifyingGlassIcon className="w-4"/>
                </button>
            </div>
</form>
)
}
