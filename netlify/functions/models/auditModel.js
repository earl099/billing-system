"use strict"

module.exports = (sequelize, DataTypes) => {
  let audit = sequelize.define(
    'auditTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      operation: {
        type: DataTypes.STRING,
      },
      user: {
        type: DataTypes.STRING
      }
    },
    {
      freezeTableName: true,
      timestamps: true,
      createdAt: 'logDate',
      updatedAt: false,
      indexes: [
        {
          name: 'PRIMARY',
          fields: ['id']
        }
      ]
    }
  )

  return audit
}
