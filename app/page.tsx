// app/page.tsx

import SearchForm from "@/components/search-form";
import React, {Suspense} from "react";
import ArtistCard from "@/components/artist-card";
import GraphCard from "@/components/graph-card";
import {Grid} from 'react-loading-icons'

// 1. Esta es la definición de tipos MÁS ROBUSTA para una página de Next.js
//    Cubre cualquier parámetro de ruta y cualquier parámetro de búsqueda.
type Props = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function Home({ searchParams }: Props) {

    // 2. Ahora, extraemos 'query' de este objeto genérico.
    //    Tenemos que asegurarnos de que es un string, ya que podría ser un array.
    const query = Array.isArray(searchParams.query) ? searchParams.query[0] : searchParams.query;

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