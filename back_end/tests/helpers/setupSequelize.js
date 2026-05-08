'use strict';

const { Sequelize } = require('sequelize');

const defineUser        = require('../../src/models/User');
const defineAccountType = require('../../src/models/AccountType');
const defineAccount     = require('../../src/models/Account');
const defineTransaction = require('../../src/models/Transaction');

/**
 * Crea una instancia de Sequelize con SQLite en memoria.
 * Cada archivo de test llama a esta función para obtener una base de datos
 * limpia y aislada, sin depender de MySQL ni de datos previos.
 *
 * @param {string[]} modelNames - Qué modelos registrar en esta instancia.
 *   Valores válidos: 'User', 'AccountType', 'Account', 'Transaction'
 * @returns {{ sequelize, User, AccountType, Account, Transaction }}
 */
function createTestDB(modelNames = ['User', 'AccountType', 'Account', 'Transaction']) {
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  });

  const models = {};

  if (modelNames.includes('User'))        models.User        = defineUser(sequelize);
  if (modelNames.includes('AccountType')) models.AccountType = defineAccountType(sequelize);
  if (modelNames.includes('Account'))     models.Account     = defineAccount(sequelize);
  if (modelNames.includes('Transaction')) models.Transaction = defineTransaction(sequelize);

  return { sequelize, ...models };
}

module.exports = { createTestDB };
