// Resync TS server
export const getAssets = async () => {
  // Mock data as Prisma model for Asset doesn't exist yet
  return [
    {
      id: "mock-asset-1",
      type: "image",
      url: "https://example-bucket.s3.amazonaws.com/image1.png",
      fileSize: 102400,
      createdAt: new Date().toISOString()
    }
  ];
};

export const getUploadUrl = async (data: any) => {
  return {
    uploadUrl: "https://example-bucket.s3.amazonaws.com/presigned-url-mock",
    assetId: `mock-asset-${Date.now()}`
  };
};

export const getAsset = async (id: string) => {
  return {
    id,
    type: "image",
    url: `https://example-bucket.s3.amazonaws.com/${id}.png`,
    fileSize: 102400,
    createdAt: new Date().toISOString()
  };
};

export const deleteAsset = async (id: string) => {
  return { id, deleted: true };
};
