import { NextRequest, NextResponse } from 'next/server';
import { validateStoreUniqueness, slugifyStoreName } from '@/lib/catalog/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || '';
    const slug = searchParams.get('slug') || '';
    const currentSlug = searchParams.get('currentSlug') || undefined;
    const accountId = searchParams.get('accountId') || undefined;

    const result = validateStoreUniqueness(name, slug, currentSlug, accountId);

    return NextResponse.json({
      success: true,
      ...result,
      cleanSlug: slugifyStoreName(slug || name),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, currentSlug, accountId } = body || {};

    const result = validateStoreUniqueness(name || '', slug || '', currentSlug, accountId);

    return NextResponse.json({
      success: true,
      ...result,
      cleanSlug: slugifyStoreName(slug || name),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
