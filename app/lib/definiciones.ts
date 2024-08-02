interface ArtistImage {
    url: string;
    height: number;
    width: number;
}

interface Artist {
    id: string;
    name: string;
    images: ArtistImage[];
    genres: string[];
    popularity: number;
}

interface ArtistsResponse {
    artists: {
        items: Artist[];
        total: number;
        limit: number;
        offset: number;
    };
}
