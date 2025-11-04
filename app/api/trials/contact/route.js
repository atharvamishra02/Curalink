import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trialId, trialTitle, trialNctId, trialLocation, subject, message } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Get patient's full details
    const patient = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        patientProfile: true
      }
    });

    // Create a trial contact inquiry record
    const inquiry = await prisma.trialInquiry.create({
      data: {
        patientId: user.userId,
        trialId: trialId || null,
        trialTitle: trialTitle,
        trialNctId: trialNctId || null,
        trialLocation: trialLocation || null,
        subject: subject,
        message: message,
        patientName: patient?.name,
        patientEmail: patient?.email,
        patientCondition: patient?.patientProfile?.condition,
        patientAge: patient?.patientProfile?.age,
        patientGender: patient?.patientProfile?.gender,
        patientLocation: patient?.patientProfile?.location,
        status: 'PENDING'
      }
    });

    // In a real application, you would:
    // 1. Send an email to the trial administrator
    // 2. Store the inquiry in a database for tracking
    // 3. Create a notification for the trial administrator

    // For now, we'll just return success
    return NextResponse.json({ 
      success: true, 
      message: 'Your inquiry has been sent successfully',
      inquiryId: inquiry.id
    });
  } catch (error) {
    console.error('Trial contact error:', error);
    return NextResponse.json({ error: 'Failed to send inquiry' }, { status: 500 });
  }
}

// Get inquiries for a user
export async function GET(request) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inquiries = await prisma.trialInquiry.findMany({
      where: {
        patientId: user.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Get inquiries error:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}
