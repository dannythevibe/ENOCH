import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Limit file size to 2MB to keep database size compact
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ message: 'File is too large (max 2MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert image buffer to base64 Data URL
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Update user's ProfilePictureUrl in the JSON mock database
    const dbPath = path.join(process.cwd(), 'enoch-db.json');
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const dbUser = db.Users.find((u: any) => u.Id === user.id);
      if (dbUser) {
        dbUser.ProfilePictureUrl = base64Image;
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      }
    }

    return NextResponse.json({ profilePictureUrl: base64Image });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
