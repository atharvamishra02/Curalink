import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, age, symptoms, conditions, city, country, specialties, researchInterests, bio, institution, orcidId, researchGateUrl, googleScholarUrl, availableForMeetings } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with profile based on role
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
    };

    if (role === 'PATIENT') {
      userData.patientProfile = {
        create: {
          age: age ? parseInt(age) : null,
          conditions: conditions || [],
          symptoms: symptoms || '',
          city: city || '',
          country: country || '',
        },
      };
    } else if (role === 'RESEARCHER') {
      userData.researcherProfile = {
        create: {
          specialties: specialties || [],
          researchInterests: researchInterests || [],
          bio: bio || '',
          institution: institution || '',
          orcidId: orcidId || '',
          researchGateUrl: researchGateUrl || '',
          googleScholarUrl: googleScholarUrl || '',
          availableForMeetings: availableForMeetings || false,
        },
      };
    }

    const user = await prisma.user.create({
      data: userData,
      include: {
        patientProfile: true,
        researcherProfile: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json(
      { 
        user: userWithoutPassword,
        message: 'Registration successful' 
      },
      { status: 201 }
    );

    // Set token in cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
