const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Importar modelos
const User = require('./User')(sequelize);
const AccountType = require('./AccountType')(sequelize);
const Account = require('./Account')(sequelize);
const Transaction = require('./Transaction')(sequelize);

// ──────────────────────────────────────────
// Definición de relaciones
// ──────────────────────────────────────────

// Un usuario tiene muchas cuentas
User.hasMany(Account, { foreignKey: 'user_id', as: 'accounts' });
Account.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Un tipo de cuenta clasifica muchas cuentas
AccountType.hasMany(Account, { foreignKey: 'account_type_id', as: 'accounts' });
Account.belongsTo(AccountType, { foreignKey: 'account_type_id', as: 'accountType' });

// Una cuenta origina muchas transacciones
Account.hasMany(Transaction, { foreignKey: 'source_account_id', as: 'outgoingTransactions' });
Transaction.belongsTo(Account, { foreignKey: 'source_account_id', as: 'sourceAccount' });

// Una cuenta recibe muchas transacciones
Account.hasMany(Transaction, { foreignKey: 'target_account_id', as: 'incomingTransactions' });
Transaction.belongsTo(Account, { foreignKey: 'target_account_id', as: 'targetAccount' });

module.exports = { sequelize, User, AccountType, Account, Transaction };
