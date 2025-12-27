// app/api/collabs/[artistId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getColabs, getArtist } from '@/lib/data';
import { Artist } from '@/lib/definiciones';


export async function GET(
  request: NextRequest,
  context: any
) {
  try {

    const { artistId } = await context.params;
    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
    }

    const artista = await getArtist(artistId);

    if (!artista || !artista.id) {
      return NextResponse.json({ error: `Artist with ID ${artistId} not found` }, { status: 404 });
    }

    const colaboradores = await getColabs(artista);

    const newNodes = colaboradores;
    const newLinks = colaboradores.map(colab => ({
      source: artistId,
      target: colab.id,
    }));

    return NextResponse.json({ newNodes, newLinks });

  } catch (error) {
    const artistId = context?.params?.artistId || 'unknown';
    console.error(`API Error for artistId ${artistId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
  }
}