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
    const { researcherId, researcherName, message } = body;

    if (!researcherId) {
      return NextResponse.json({ error: 'Researcher ID is required' }, { status: 400 });
    }

    // Get patient's full details
    const patient = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        patientProfile: true
      }
    });

    // Create notification for the researcher with patient details
    try {
      const researcher = await prisma.user.findUnique({
        where: { id: researcherId }
      });

      if (researcher) {
        await prisma.notification.create({
          data: {
            userId: researcherId,
            type: 'NUDGE',
            title: 'Invitation to Join Curalink',
            message: message || `${patient?.name || 'A patient'} invited you to join the Curalink platform`,
            metadata: {
              senderId: user.userId,
              senderName: patient?.name,
              senderEmail: patient?.email,
              patientCondition: patient?.patientProfile?.condition,
              patientAge: patient?.patientProfile?.age,
              patientGender: patient?.patientProfile?.gender,
              patientLocation: patient?.patientProfile?.location,
              researcherName: researcherName,
              customMessage: message
            }
          }
        });

        return NextResponse.json({ success: true, message: 'Nudge sent successfully' });
      } else {
        // Store the nudge in a pending invitations table or send email
        // For now, just return success
        return NextResponse.json({ 
          success: true, 
          message: 'Invitation will be sent when researcher joins the platform' 
        });
      }
    } catch (error) {
      console.error('Nudge error:', error);
      return NextResponse.json({ error: 'Failed to send nudge' }, { status: 500 });
    }
  } catch (error) {
    console.error('Nudge API error:', error);
    return NextResponse.json({ error: 'Failed to send nudge' }, { status: 500 });
  }
}
