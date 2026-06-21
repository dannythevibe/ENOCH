import { NextResponse } from 'next/server';
import { dbRun, dbGet } from '@/lib/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'enoch_super_secret_key_2026';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await dbGet('SELECT * FROM Users WHERE Email = ?', [email]);
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    // Hash password with native crypto
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Insert user
    const result = await dbRun(
      'INSERT INTO Users (FullName, Email, PasswordHash) VALUES (?, ?, ?)',
      [fullName, email, passwordHash]
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.lastID, email, fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ 
      token, 
      user: { id: result.lastID, email, fullName } 
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
