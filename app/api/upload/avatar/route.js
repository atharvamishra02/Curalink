import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value || request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const publicId = `user-${decoded.userId}-${Date.now()}`;
    const result = await uploadToCloudinary(buffer, 'avatars', publicId);

    console.log('✅ Avatar uploaded to Cloudinary:', result.url);

    return NextResponse.json({
      success: true,
      avatarUrl: result.url,
      publicId: result.publicId,
      message: 'Avatar uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar', details: error.message },
      { status: 500 }
    );
  }
}
