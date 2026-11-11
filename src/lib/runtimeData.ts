import path from 'node:path';

export function runtimeDataPath(filename: string): string {
  const dataDir = process.env.SANADOKOM_DATA_DIR?.trim();
  return path.join(dataDir || path.join(process.cwd(), 'prisma'), filename);
}
