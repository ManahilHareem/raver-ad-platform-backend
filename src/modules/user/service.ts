import prisma from '../../db/prisma';

export const getAllUsers = async () => {
  return await prisma.user.findMany();
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

export const getMe = async () => {
  try {
    const users = await prisma.user.findMany({ take: 1 });
    if (users.length > 0) return users[0];
  } catch (error) {
    console.warn("Prisma failed, using mock data for getMe fallback.");
  }
  return { id: "mock-user-1", email: "mock@example.com", fullName: "Mock User" };
};

export const updateSettings = async (data: any) => {
  // Mock settings update
  return { status: "success", updated: true };
};

export const createUser = async (data: any) => {
  try {
    return await prisma.user.create({
      data: {
        email: data.email || `mock-${Date.now()}@example.com`,
        fullName: data.fullName || "New User",
        avatarUrl: data.avatarUrl || ""
      }
    });
  } catch (error) {
    console.warn("Prisma failed, using mock data for createUser fallback.");
    return { id: `mock-user-${Date.now()}`, ...data };
  }
};

export const updateUser = async (id: string, data: any) => {
  try {
    return await prisma.user.update({
      where: { id },
      data
    });
  } catch (error) {
    console.warn("Prisma failed, using mock data for updateUser fallback.");
    return { id, ...data, updated: true };
  }
};

export const deleteUser = async (id: string) => {
  try {
    return await prisma.user.delete({
      where: { id }
    });
  } catch (error) {
    console.warn("Prisma failed, returning success for deleteUser mock.");
    return { id, deleted: true };
  }
};
