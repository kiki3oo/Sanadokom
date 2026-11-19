import { NextRequest, NextResponse } from 'next/server';
import { DIGYLOG_CITIES, MOROCCAN_CITIES, searchMoroccanCities, findMatchingDigylogCity } from '@/lib/moroccanCities';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const exact = searchParams.get('exact') === 'true';
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    if (exact && query) {
      const match = findMatchingDigylogCity(query);
      return NextResponse.json({
        success: true,
        match,
        found: Boolean(match),
      });
    }

    if (query) {
      const results = searchMoroccanCities(query, limit);
      return NextResponse.json({
        success: true,
        count: results.length,
        cities: results,
      });
    }

    // Return paginated or default list
    return NextResponse.json({
      success: true,
      count: DIGYLOG_CITIES.length,
      cities: DIGYLOG_CITIES.slice(0, limit),
      allNames: MOROCCAN_CITIES.slice(0, limit),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
