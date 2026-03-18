export const getTemplates = async () => {
  // Mock data as Prisma model for Template doesn't exist yet
  return [
    {
      id: "mock-template-1",
      name: "Standard Promo",
      category: "ecommerce",
      isPublic: true,
      data: {
        nodes: []
      }
    }
  ];
};

export const createTemplate = async (data: any) => {
  return {
    id: `mock-template-${Date.now()}`,
    name: data.name || "New Template",
    category: data.category || "general",
    isPublic: data.isPublic !== undefined ? data.isPublic : false,
    data: data.data || { nodes: [] }
  };
};

export const getTemplate = async (id: string) => {
  return {
    id,
    name: "Mock Template Data",
    category: "general",
    isPublic: true,
    data: { nodes: [] }
  };
};

export const updateTemplate = async (id: string, data: any) => {
  return { id, ...data, updatedAt: new Date().toISOString() };
};

export const deleteTemplate = async (id: string) => {
  return { id, deleted: true };
};
