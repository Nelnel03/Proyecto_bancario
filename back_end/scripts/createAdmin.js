/**
 * @file scripts/createAdmin.js
 * @description Crea o actualiza usuarios del panel de administración.
 *
 * Roles numéricos:
 *   1 = Super Admin  → node scripts/createAdmin.js --role=1
 *   2 = Admin        → node scripts/createAdmin.js --role=2  (default)
 *   3 = Evaluador    → node scripts/createAdmin.js --role=3
 *
 * Variables de entorno opcionales:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROLE
 *
 * Ejemplos:
 *   node scripts/createAdmin.js
 *   ADMIN_EMAIL=super@banco.com ADMIN_ROLE=1 node scripts/createAdmin.js
 */

require('dotenv').config();
const bcrypt     = require('bcryptjs');
const { ROLES, ROLE_LABELS } = require('../src/utils/roles');

// ── Leer argumento --role=N desde CLI ────────────────────────────────────────
const roleArg = process.argv.find((a) => a.startsWith('--role='));
const roleNum = parseInt(
  roleArg?.split('=')[1] ?? process.env.ADMIN_ROLE ?? '2'
);

if (![1, 2, 3].includes(roleNum)) {
  console.error('❌ Rol inválido. Usa --role=1, --role=2 o --role=3');
  process.exit(1);
}

const DEFAULTS = {
  1: { name: 'Super Admin',  email: 'superadmin@banco.com', password: 'SuperAdmin123!' },
  2: { name: 'Admin',        email: 'admin@banco.com',      password: 'Admin123!'      },
  3: { name: 'Evaluador',    email: 'evaluador@banco.com',  password: 'Evaluador123!'  },
};

const NAME     = process.env.ADMIN_NAME     || DEFAULTS[roleNum].name;
const EMAIL    = process.env.ADMIN_EMAIL    || DEFAULTS[roleNum].email;
const PASSWORD = process.env.ADMIN_PASSWORD || DEFAULTS[roleNum].password;

async function main() {
  const { User, sequelize } = require('../src/models');

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la BD establecida');

    const existing = await User.findOne({ where: { email: EMAIL } });
    if (existing) {
      if (existing.role === roleNum) {
        console.log(`ℹ️  Ya existe un usuario con email ${EMAIL} y rol "${ROLE_LABELS[roleNum]}"`);
      } else {
        await existing.update({ role: roleNum });
        console.log(`✅ Usuario ${EMAIL} actualizado a rol "${ROLE_LABELS[roleNum]}" (${roleNum})`);
      }
      process.exit(0);
    }

    // Verificar unicidad de super_admin
    if (roleNum === ROLES.SUPER_ADMIN) {
      const existingSA = await User.findOne({ where: { role: ROLES.SUPER_ADMIN } });
      if (existingSA) {
        console.error(`❌ Ya existe un Super Admin: ${existingSA.email}`);
        console.log('   Solo puede existir un Super Admin en el sistema.');
        process.exit(1);
      }
    }

    const password_hash = await bcrypt.hash(PASSWORD, 10);
    await User.create({ full_name: NAME, email: EMAIL, password_hash, role: roleNum, is_active: true });

    console.log(`✅ Usuario "${ROLE_LABELS[roleNum]}" creado exitosamente`);
    console.log(`   Email:    ${EMAIL}`);
    console.log(`   Password: ${PASSWORD}`);
    console.log(`   Rol:      ${roleNum} — ${ROLE_LABELS[roleNum]}`);
    console.log('\n⚠️  Cambia la contraseña antes de ir a producción.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
