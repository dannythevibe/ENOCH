import { NextResponse } from 'next/server';
import { dbGet } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch latest user details from DB
    const dbUser = await dbGet('SELECT Id, FullName, Email, CreatedAt FROM Users WHERE Id = ?', [user.id]);
    if (!dbUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: dbUser.Id,
      email: dbUser.Email,
      fullName: dbUser.FullName,
      profilePictureUrl: dbUser.ProfilePictureUrl || null,
      createdAt: dbUser.CreatedAt
    });

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
