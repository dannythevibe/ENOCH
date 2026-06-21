import { NextResponse } from 'next/server';
import { dbAll, dbRun } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const messages = await dbAll('SELECT * FROM Messages WHERE UserId = ? ORDER BY Timestamp ASC', [user.id]);
    
    const mapped = messages.map(m => ({
      id: m.Id,
      role: m.Role,
      content: m.Content,
      timestamp: m.Timestamp
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { role, content } = await request.json();

    if (!role || !content) {
      return NextResponse.json({ message: 'Role and content are required' }, { status: 400 });
    }

    const result = await dbRun(
      'INSERT INTO Messages (UserId, Role, Content) VALUES (?, ?, ?)',
      [user.id, role, content]
    );

    return NextResponse.json({ id: result.lastID, role, content }, { status: 201 });
  } catch (error) {
    console.error('Post message error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
