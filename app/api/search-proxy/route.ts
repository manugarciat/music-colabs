import { NextRequest, NextResponse } from 'next/server';
import { searchArtist } from '@/lib/data';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ artists: [] });
    }

    try {
        const data = await searchArtist(query);
        // Return only relevant info for the dropdown to minimize payload
        const artists = data.artists.items.map(artist => ({
            id: artist.id,
            name: artist.name,
            images: artist.images,
            popularity: artist.popularity,
            followers: artist.followers
        }));

        return NextResponse.json({ artists });
    } catch (error) {
        console.error('Search proxy error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
