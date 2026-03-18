export const getProjects = async () => {
  // Mock data as Prisma model for Project doesn't exist yet
  return [
    {
      id: "mock-proj-1",
      name: "Q3 Campaign Launch",
      description: "Main projects for Q3",
      status: "active",
      createdAt: new Date().toISOString()
    }
  ];
};

export const createProject = async (data: any) => {
  return {
    id: `mock-proj-${Date.now()}`,
    name: data.name || "New Project",
    description: data.description || "",
    status: "active",
    createdAt: new Date().toISOString()
  };
};

export const getProject = async (id: string) => {
  return {
    id,
    name: "Mock Project Data",
    description: "Mock description",
    status: "active",
    createdAt: new Date().toISOString()
  };
};

export const updateProject = async (id: string, data: any) => {
  return {
    id,
    ...data,
    updatedAt: new Date().toISOString()
  };
};

export const deleteProject = async (id: string) => {
  return { id, deleted: true };
};
