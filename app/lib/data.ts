'use server'

import {Artist, ArtistsResponse, RelatedResponse} from "@/app/lib/definiciones";

async function getToken(): Promise<String> {

    const basicAuth = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        body: new URLSearchParams({
            'grant_type': 'client_credentials',
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
        },
        next: {revalidate: 3570}
    });

    const data = await response.json();
    const {access_token} = data;
    return access_token
}


export async function getArtist(req: string | undefined): Promise<Artist | undefined> {

    if (req) {

        const token = await getToken();

        const response = await fetch(`https://api.spotify.com/v1/search?q=${req}&type=artist`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },

        });
        const data: ArtistsResponse = await response.json();
        return data.artists.items[0]

    } else return undefined;
}

export async function getRelated(id: string): Promise<RelatedResponse> {

    const token = await getToken();

    const response = await fetch(`https://api.spotify.com/v1/artists/${id}/related-artists`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return await response.json()
}