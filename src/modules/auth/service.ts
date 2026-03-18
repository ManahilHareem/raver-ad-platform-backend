import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';

// Mock DB for local dev since Prisma User model lacks password
const mockUsers: any[] = [];

export const signup = async (email: string, password: string, fullName?: string) => {
  // Check if user exists in mock DB
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: `user-${Date.now()}`,
    email,
    password: hashedPassword,
    fullName: fullName || '',
  };
  
  mockUsers.push(newUser);

  // Generate JWT Profile
  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

  return {
    user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName },
    token
  };
};

export const login = async (email: string, password: string) => {
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return {
    user: { id: user.id, email: user.email, fullName: user.fullName },
    token
  };
};
