import { NextRequest, NextResponse } from 'next/server';
import { searchZips } from '@/lib/db';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  if (!/^\d{1,5}$/.test(q)) {
    return NextResponse.json({ results: [] });
  }

  const results = searchZips(q);
  return NextResponse.json({ results });
}
