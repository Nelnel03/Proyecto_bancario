'use strict';

/**
 * Convierte la columna `role` de ENUM('user','admin') a TINYINT UNSIGNED
 * e introduce el esquema de 4 roles numéricos:
 *
 *   1 = super_admin
 *   2 = admin
 *   3 = evaluador
 *   4 = usuario  (default)
 *
 * Estrategia de migración (segura para MySQL):
 *   1. Añadir columna temporal `role_num` como TINYINT
 *   2. Copiar datos: 'admin' → 2, cualquier otro → 4
 *   3. Eliminar la columna ENUM `role`
 *   4. Renombrar `role_num` → `role`
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Columna temporal numérica
    await queryInterface.addColumn('users', 'role_num', {
      type:         Sequelize.TINYINT.UNSIGNED,
      allowNull:    false,
      defaultValue: 4,
    });

    // 2. Migrar datos existentes
    await queryInterface.sequelize.query(`
      UPDATE users
      SET role_num = CASE
        WHEN role = 'admin' THEN 2
        ELSE 4
      END
    `);

    // 3. Eliminar columna ENUM antigua
    await queryInterface.removeColumn('users', 'role');

    // 4. Renombrar la columna temporal al nombre definitivo
    await queryInterface.renameColumn('users', 'role_num', 'role');
  },

  async down(queryInterface, Sequelize) {
    // Proceso inverso: volver al ENUM
    await queryInterface.addColumn('users', 'role_enum', {
      type:         Sequelize.ENUM('user', 'admin'),
      allowNull:    false,
      defaultValue: 'user',
    });

    await queryInterface.sequelize.query(`
      UPDATE users
      SET role_enum = CASE
        WHEN role = 2 THEN 'admin'
        ELSE 'user'
      END
    `);

    await queryInterface.removeColumn('users', 'role');
    await queryInterface.renameColumn('users', 'role_enum', 'role');
  },
};
