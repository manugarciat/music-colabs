import Image from "next/image";
import {getData} from "@/app/lib/data";

import SearchForm from "@/app/ui/search-form";

export default async function Home({searchParams}: { searchParams?: { query?: string } }) {

    const query = searchParams?.query || 'Downtown Binary'; //hay que mejorar el manejo de errores
    const artista: Artist = await getData(query);

    return (
        <main className="flex flex-col items-center p-24 h-screen">

            <SearchForm/>

            <div className="text-4xl font-extrabold m-1"> {artista.name} </div>
            {artista.id}
            <Image src={artista.images[0].url} alt="hola" width={artista.images[0].width}
                   height={artista.images[0].height}/>
        </main>
    );
}
