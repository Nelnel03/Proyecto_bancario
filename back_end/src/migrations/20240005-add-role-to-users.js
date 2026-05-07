'use strict';

/**
 * Agrega la columna `role` a la tabla `users`.
 * Valores posibles: 'user' (default) | 'admin'
 *
 * Se usa ENUM para que MySQL rechace cualquier valor fuera del conjunto
 * definido, evitando roles inválidos a nivel de base de datos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
      after: 'is_active', // posición en la tabla (solo informativa en MySQL)
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'role');
    // MySQL requiere eliminar el tipo ENUM manualmente al hacer rollback
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS `enum_users_role`");
  },
};
