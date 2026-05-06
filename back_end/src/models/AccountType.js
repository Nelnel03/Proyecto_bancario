const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AccountType = sequelize.define('AccountType', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'account_types',
    timestamps: false,
  });

  return AccountType;
};
