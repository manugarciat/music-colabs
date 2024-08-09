import SearchForm from "@/app/ui/search-form";
import {Suspense} from "react";
import ArtistCard from "@/app/ui/artist-card";
import ArtistRelated from "@/app/ui/artist-related";

import GraphCard from "@/app/ui/graph-card";

export default async function Home({searchParams}: { searchParams?: { query?: string } }) {

    const query = searchParams?.query || undefined; //hay que mejorar el manejo de errores


    return (

            <main className="flex flex-row">
                <div className="w-[250px] flex-col m-5 ml-10 bg-[#252525] rounded-lg p-2">
                    <SearchForm />
                    <ArtistCard query={query}/>
                </div>
                <div className="m-5 ml-0 bg-[#252525] rounded-lg w-[1920px] h-[1080px]">

                    <Suspense key={query} fallback={<div className="text-center p-10">Cargando...</div>}>
                        {/*<ArtistRelated query={query}/>*/}
                        <GraphCard query={query}/>
                    </Suspense>
                </div>

            </main>


    )

}
