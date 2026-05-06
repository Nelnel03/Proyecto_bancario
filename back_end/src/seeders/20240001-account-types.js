'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('account_types', [
      { name: 'savings',  description: 'Cuenta de ahorros' },
      { name: 'checking', description: 'Cuenta corriente' },
      { name: 'payroll',  description: 'Cuenta nómina' },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('account_types', null, {});
  },
};
