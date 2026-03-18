import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';

export const signup = async (email: string, password: string, fullName?: string) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName: fullName || '',
    }
  });

  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
  return { user: { id: newUser.id, email: newUser.email, fullName: newUser.fullName }, token };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return { user: { id: user.id, email: user.email, fullName: user.fullName }, token };
};
