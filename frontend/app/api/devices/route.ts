import { NextResponse } from 'next/server';
import { dbAll, dbRun } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const devices = await dbAll('SELECT * FROM Devices WHERE UserId = ?', [user.id]);
    
    // Map to camelCase
    const mappedDevices = devices.map(d => ({
      id: d.Id,
      name: d.Name,
      macAddress: d.MacAddress,
      batteryLevel: d.BatteryLevel,
      location: d.Location,
      status: d.Status
    }));

    return NextResponse.json(mappedDevices);
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { name, macAddress, batteryLevel } = await request.json();
    if (!name || !macAddress) {
      return NextResponse.json({ message: 'Name and macAddress are required' }, { status: 400 });
    }

    const finalBattery = batteryLevel !== undefined ? Number(batteryLevel) : Math.floor(Math.random() * 40) + 60;
    const location = "Redemption Campus, Library"; // Mock initial location
    const status = "Connected";

    const result = await dbRun(
      'INSERT INTO Devices (Name, MacAddress, UserId, BatteryLevel, Location, Status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, macAddress, user.id, finalBattery, location, status]
    );

    return NextResponse.json({
      id: result.lastID,
      name,
      macAddress,
      batteryLevel: finalBattery,
      location,
      status
    }, { status: 201 });

  } catch (error) {
    console.error('Add device error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
