// app/page.tsx

import SearchForm from "@/components/search-form";
import React, {Suspense} from "react";
import ArtistCard from "@/components/artist-card";
import GraphCard from "@/components/graph-card";
import {Grid} from 'react-loading-icons'

export default async function Home({ searchParams }: { searchParams: Promise<{ query?: string | undefined }> }) {
      const resolvedSearchParams = await searchParams;
      const query = resolvedSearchParams.query;

    return (
        <main className="relative h-screen w-screen overflow-hidden">
            {/* Contenedor para los controles (tarjeta y búsqueda) */}
            <div className="absolute top-0 left-0 z-10 p-5">
                <div className="w-[300px] bg-background/80 backdrop-blur-sm p-4 rounded-lg">
                    <SearchForm />
                    <ArtistCard query={query} />
                </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-full">
                <Suspense key={query} fallback={
                    <div className="text-center p-10 text">Cargando...
                    {/*<Grid fill="#000000"/>*/}
                    </div>}
                >
                    <GraphCard query={query}/>
                </Suspense>
            </div>
        </main>
    )
}

