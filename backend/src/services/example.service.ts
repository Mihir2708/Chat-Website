export const processExampleData = async (data: any) => {
  // Simulate some business logic or DB operation
  return {
    id: Math.floor(Math.random() * 1000),
    ...data,
    processedAt: new Date(),
  };
};
