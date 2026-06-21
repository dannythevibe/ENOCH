import { NextResponse } from 'next/server';
import { dbGet } from '@/lib/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'enoch_super_secret_key_2026';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Find user
    const user = await dbGet('SELECT * FROM Users WHERE Email = ?', [email]);
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    if (user.PasswordHash !== passwordHash) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.Id, email: user.Email, fullName: user.FullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ 
      token, 
      user: { id: user.Id, email: user.Email, fullName: user.FullName } 
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
