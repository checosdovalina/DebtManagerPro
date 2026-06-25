import { storage } from "./storage";
import { USER_ROLES } from "@shared/schema";
import bcrypt from "bcryptjs";

/**
 * Restablece (o crea) el usuario administrador para poder iniciar sesión.
 *
 * Uso en la VPS (después de `git pull` y antes/después de `pm2 restart dcs`):
 *   npx tsx server/reset-admin.ts                 -> admin@dcs.com / password123
 *   npx tsx server/reset-admin.ts "MiClaveSegura" -> admin@dcs.com / MiClaveSegura
 *   ADMIN_EMAIL=otro@dcs.com npx tsx server/reset-admin.ts "MiClave"
 *
 * Notas:
 * - Si la contraseña es "password123" se guarda en texto plano para que funcione
 *   el caso especial de login del admin demo.
 * - Cualquier otra contraseña se guarda con hash bcrypt (login normal).
 * - Solo toca el usuario administrador; no modifica clientes, deudores ni deudas.
 */
async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@dcs.com";
  const newPassword = process.argv[2] || process.env.ADMIN_PASSWORD || "password123";

  const stored =
    newPassword === "password123" ? "password123" : await bcrypt.hash(newPassword, 10);

  const existing = await storage.getUserByEmail(email);

  if (existing) {
    await storage.updateUser(existing.id, { password: stored });
    console.log(`✓ Contraseña restablecida para ${email} (id=${existing.id}).`);
  } else {
    const created = await storage.createUser({
      fullName: "Administrador",
      email,
      phone: "",
      password: stored,
      role: USER_ROLES.ADMIN,
    });
    console.log(`✓ Usuario administrador creado: ${email} (id=${created.id}).`);
  }

  console.log(`  Ahora puedes iniciar sesión con: ${email} / ${newPassword}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error al restablecer el administrador:", err);
    process.exit(1);
  });
