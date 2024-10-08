import SearchForm from "@/components/search-form";
import {Suspense} from "react";
import ArtistCard from "@/components/artist-card";
import GraphCard from "@/components/graph-card";

export default async function Home({searchParams}: { searchParams?: { query?: string } }) {

    const query = searchParams?.query || undefined; //hay que mejorar el manejo de errores

    return (
            <main className="flex flex-row">
                <div className="w-[300px] flex-col m-5 ml-10 pt-10 p-8">
                    {/*<h2 className="text-1xl font-extrabold m-1 text-center">Music Connections</h2>*/}
                    <SearchForm />
                    <ArtistCard query={query}/>
                </div>
                <div className="m-5 ml-0 w-[1280px] h-[1080px]">

                    <Suspense key={query} fallback={<div className="text-center p-10">Cargando...</div>}>
                        {/*<ArtistRelated query={query}/>*/}
                        <GraphCard query={query}/>
                    </Suspense>
                </div>
            </main>
    )
}
