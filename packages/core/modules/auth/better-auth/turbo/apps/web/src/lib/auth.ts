import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { getDb } from "@/lib/db";

export function getAuth() {
  return betterAuth({
    database: prismaAdapter(getDb(), {
      provider: "__BETTER_AUTH_PROVIDER__"
    }),
    emailAndPassword: {
      enabled: true
    }
  });
}
