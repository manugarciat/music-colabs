import SearchForm from "@/app/ui/search-form";
import {Suspense} from "react";
import ArtistCard from "@/app/ui/artist-card";
import ArtistRelated from "@/app/ui/artist-related";
import {getArtist} from "@/app/lib/data";

import {Artist} from "@/app/lib/definiciones";
import LinePlot from "@/app/ui/grafo";

export default async function Home({searchParams}: { searchParams?: { query?: string } }) {

    const query = searchParams?.query || undefined; //hay que mejorar el manejo de errores
    const artista: Artist | undefined = await getArtist(query);

    return (
        <main className="flex flex-col items-center p-24 h-screen">

            <SearchForm/>

            <Suspense fallback={<div>Cargando...</div>}>
                <ArtistCard query={artista}/>
                <ArtistRelated id={artista?.id}/>
            </Suspense>

            <div >
                <LinePlot/>
            </div>
        </main>
    );
}
