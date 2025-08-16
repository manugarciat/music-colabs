// app/api/collabs/[artistId]/route.ts

import { NextResponse } from 'next/server';
import { getColabs, getArtist } from '@/lib/data'; // Reutilizamos nuestras funciones!
import { Artist } from '@/lib/definiciones';


type RouteContext = {
  params: {
    artistId: string;
  };
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const artistId = context.params.artistId;
    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
    }

    // Para llamar a getColabs, necesitamos el objeto 'Artist' completo.
    // Así que primero lo buscamos por su ID.
    const artista = await getArtist(artistId);

    // Obtenemos sus colaboradores
    const colaboradores = await getColabs(artista);

    // Preparamos la respuesta: los nuevos nodos y los nuevos enlaces
    const newNodes = colaboradores;
    const newLinks = colaboradores.map(colab => ({
      source: artistId,
      target: colab.id,
    }));

    return NextResponse.json({ newNodes, newLinks });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
  }
}