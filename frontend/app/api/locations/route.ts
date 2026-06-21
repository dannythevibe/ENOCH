import { NextResponse } from 'next/server';
import { dbRun } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { deviceId, latitude, longitude } = await request.json();

    if (!deviceId || !latitude || !longitude) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    await dbRun(
      'INSERT INTO Locations (DeviceId, Latitude, Longitude) VALUES (?, ?, ?)',
      [deviceId, latitude, longitude]
    );

    return new NextResponse('OK', { status: 201 });
  } catch (error) {
    console.error('Add location error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
