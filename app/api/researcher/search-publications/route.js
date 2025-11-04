import { NextResponse } from 'next/server';
import { searchPubMed, fetchPubMedDetails } from '@/lib/pubmed';
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

// Search external publications based on researcher's info
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || user.role !== 'RESEARCHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const researcherName = searchParams.get('name') || '';
    const specialty = searchParams.get('specialty') || '';
    const affiliation = searchParams.get('affiliation') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build search query based on researcher info
    let query = '';
    if (researcherName) {
      // Search by author name
      query = `${researcherName}[Author]`;
      
      // Add affiliation if available
      if (affiliation) {
        query += ` AND ${affiliation}[Affiliation]`;
      }
      
      // Add specialty/research area if available
      if (specialty) {
        query += ` AND ${specialty}`;
      }
    } else if (specialty) {
      query = specialty;
    }

    if (!query) {
      return NextResponse.json({ publications: [] });
    }

    console.log('Searching PubMed for researcher:', query);

    // Search PubMed
    const ids = await searchPubMed(query, limit);
    
    if (ids.length === 0) {
      return NextResponse.json({ 
        publications: [],
        count: 0,
        query 
      });
    }

    // Fetch details for found publications
    const publications = await fetchPubMedDetails(ids);

    return NextResponse.json({ 
      publications,
      count: publications.length,
      query 
    });
  } catch (error) {
    console.error('Error searching publications:', error);
    return NextResponse.json({ error: 'Failed to search publications', publications: [] }, { status: 500 });
  }
}
