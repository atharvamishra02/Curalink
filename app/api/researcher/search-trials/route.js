import { NextResponse } from 'next/server';
import { searchClinicalTrials } from '@/lib/clinicalTrials';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function getUserFromToken(request) {
  const token = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value;
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch {
    return null;
  }
}

// Search external clinical trials based on researcher's info
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const researcherName = searchParams.get('name') || '';
    const specialty = searchParams.get('specialty') || '';
    const condition = searchParams.get('condition') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build search query based on researcher info
    let query = '';
    if (researcherName) {
      query = researcherName;
    } else if (specialty) {
      query = specialty;
    } else if (condition) {
      query = condition;
    }

    if (!query) {
      return NextResponse.json({ trials: [] });
    }

    console.log('Searching clinical trials for researcher:', query);

    // Search ClinicalTrials.gov API
    const trials = await searchClinicalTrials({
      query,
      limit
    });

    return NextResponse.json({ 
      trials,
      count: trials.length,
      query 
    });
  } catch (error) {
    console.error('Error searching clinical trials:', error);
    return NextResponse.json({ error: 'Failed to search trials', trials: [] }, { status: 500 });
  }
}
