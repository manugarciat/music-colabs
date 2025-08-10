// app/page.tsx

import SearchForm from "@/components/search-form";
import React, {Suspense} from "react";
import ArtistCard from "@/components/artist-card";
import GraphCard from "@/components/graph-card";
import {Grid} from 'react-loading-icons'

// 1. Cambiamos un poco la definición del tipo para que no sea opcional
export default async function Home({searchParams}: { searchParams: { query?: string } }) {

    // 2. Accedemos a la query de forma más directa.
    const query = searchParams.query;

    return (
        <main className="flex flex-row">
            <div className="w-[300px] flex-col m-5 ml-10 pt-10 p-8">
                <SearchForm/>
                <ArtistCard query={query}/>
            </div>
            <div className="m-5 ml-0 w-[1280px] h-[1080px]">

                <Suspense key={query} fallback={<div className="text-center p-10 text">Cargando...
                    <Grid fill="#000000"/></div>}>
                    <GraphCard query={query}/>
                </Suspense>
            </div>
        </main>
    )
}