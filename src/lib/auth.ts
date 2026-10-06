import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { checkRateLimit, getClientIp } from "./rate-limit";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      name: string;
      email: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    id?: string;
  }
}

// Hash "señuelo" con costo real: se compara contra él cuando el usuario no
// existe, para que un intento de login tarde lo mismo con email inválido que
// con contraseña incorrecta (evita filtrar por tiempo de respuesta qué
// emails/usuarios están registrados).
const DUMMY_HASH =
  "$2b$12$.eIXtBXHB78WDrMFt310HuU8NWZXhsbpn9znI9XxXG7ggnA6ccfAq";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Usuario o email", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials, request) => {
        const identifier = credentials?.identifier;
        const password = credentials?.password;

        if (
          typeof identifier !== "string" ||
          typeof password !== "string" ||
          password.length === 0 ||
          password.length > 72
        ) {
          return null;
        }

        const normalizedIdentifier = identifier.trim().toLowerCase();

        // Frenamos fuerza bruta por cuenta (sin importar desde qué IP viene)
        // y por IP (sin importar qué cuentas está probando).
        const ip = getClientIp(request);
        const perAccount = checkRateLimit(
          `login:account:${normalizedIdentifier}`,
          10,
          15 * 60 * 1000
        );
        const perIp = checkRateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
        if (!perAccount.allowed || !perIp.allowed) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: normalizedIdentifier },
              { username: normalizedIdentifier },
            ],
          },
        });

        // Comparamos siempre contra un hash (real o señuelo) para que el
        // tiempo de respuesta no delate si el usuario existe.
        const valid = await bcrypt.compare(
          password,
          user?.passwordHash ?? DUMMY_HASH
        );
        if (!user || !valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
});
