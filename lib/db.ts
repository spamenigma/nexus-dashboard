import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/lib/generated/prisma/client";
import path from "path";

function getDbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) {
    if (url.startsWith("file:./") || url.startsWith("file:../")) {
      const rel = url.slice("file:".length);
      return `file:${path.resolve(process.cwd(), rel)}`;
    }
    return url;
  }
  return `file:${path.resolve(process.cwd(), "dev.db")}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma(): PrismaClient {
  const adapter = new PrismaLibSql({ url: getDbUrl() });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const db = globalForPrisma.prisma ?? createPrisma();
globalForPrisma.prisma = db;
