import { NextResponse } from 'next/server';
import { getDrugSafetyInfo, searchDrugInfo } from '@/lib/openFDA';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const drugName = searchParams.get('drug');
    const type = searchParams.get('type') || 'safety'; // 'safety' or 'info'

    if (!drugName) {
      return NextResponse.json(
        { error: 'Drug name is required' },
        { status: 400 }
      );
    }

    let data;
    if (type === 'info') {
      data = await searchDrugInfo(drugName, 5);
    } else {
      data = await getDrugSafetyInfo(drugName);
    }

    return NextResponse.json({
      success: true,
      drug: drugName,
      data,
    });
  } catch (error) {
    console.error('Drug info API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drug information' },
      { status: 500 }
    );
  }
}
