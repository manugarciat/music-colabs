
import React from 'react'

import RelatedGraph from "@/components/related-graph";

export default function GraphCard({query}: { query: string | undefined }) {

    if (!query) return null


    return (
        <>
            <RelatedGraph query={query}/>
        </>
    )
}
