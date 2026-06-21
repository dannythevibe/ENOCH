import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'enoch_super_secret_key_2026';

export function getUserFromRequest(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as { id: number; email: string; fullName: string };
  } catch (error) {
    return null;
  }
}
