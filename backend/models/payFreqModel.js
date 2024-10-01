"use strict"

module.exports = (sequelize, DataTypes) => {
  let payFreq = sequelize.define(
    'payFreqTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      payType: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      }
    },
    {
      freezeTableName: true,
      timestamps: false,
      createdAt: false,
      updatedAt: false,
      indexes: [
        {
          name: 'PRIMARY',
          fields: ['id']
        }
      ]
    }
  )

  return payFreq
}
