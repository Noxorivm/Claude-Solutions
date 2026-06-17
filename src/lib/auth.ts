import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    // Regla A1 (docs/03): contraseña de 10 caracteres como mínimo.
    minPasswordLength: 10,
  },
  // Rate limiting básico de auth (docs/04 §Seguridad). better-auth solo lo
  // activa en producción; en dev queda inactivo a propósito.
  rateLimit: {
    window: 60,
    max: 20,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false,
      },
      xp: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false,
      },
      free_roam: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      // Cuenta desactivada por un admin (docs/03 §H4). input:false: solo
      // se cambia desde el panel de usuarios, nunca desde el cliente.
      disabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
});
