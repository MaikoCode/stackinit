import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type PrismaClientInstance = {
  $disconnect(): Promise<void>;
};

type PrismaPackage = {
  PrismaClient: new () => PrismaClientInstance;
};

const globalForPrisma = globalThis as {
  prisma?: PrismaClientInstance;
};

export function getDb() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const { PrismaClient } = require("@prisma/client") as PrismaPackage;
  const db = new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
  }

  return db;
}
