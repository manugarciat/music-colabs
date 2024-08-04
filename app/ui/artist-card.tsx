import React from 'react'
import Image from "next/image";
import {Artist} from "@/app/lib/definiciones";

export default async function ArtistCard({query}: { query: Artist | undefined }) {

    if (query) {
        return (
            <div>
                <div className="text-4xl font-extrabold m-1"> {query.name} </div>
                {query.id}
                <Image src={query.images[0].url} alt="hola" width={query.images[0].width}
                       height={query.images[0].height}/>
            </div>
        )
    } else {
        return <div>Busca un artista</div>;            ;
    }
}
