import { NextResponse } from 'next/server';
import { dbRun, dbGet } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    const newStatus = await request.text(); // Status is sent as a raw string in DeviceRecoveryModule

    if (!newStatus) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    // Verify ownership
    const device = await dbGet('SELECT * FROM Devices WHERE Id = ? AND UserId = ?', [id, user.id]);
    if (!device) {
      return NextResponse.json({ message: 'Device not found' }, { status: 404 });
    }

    await dbRun('UPDATE Devices SET Status = ? WHERE Id = ?', [newStatus.replace(/"/g, ''), id]);

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Update device status error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
