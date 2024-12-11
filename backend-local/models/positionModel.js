"use strict"

module.exports = (sequelize, DataTypes) => {
  let position = sequelize.define(
    'positionTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      posCode: {
        type: DataTypes.STRING(50)
      },
      posName: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      dailySalaryRate: {
        type: DataTypes.DECIMAL(10, 2)
      },
      dailyBillingRate: {
        type: DataTypes.DECIMAL(10, 2)
      },
      monthlySalaryRate: {
        type: DataTypes.DECIMAL(10, 2)
      },
      monthlyBillingRate: {
        type: DataTypes.DECIMAL(10, 2)
      },
      description: {
        type: DataTypes.STRING
      },
      status: {
        type: DataTypes.STRING(50)
      }
    },
    {
      freezeTableName: true,
      timestamps: false,
      createdAt: false,
      updatedAt: false,
      indexes: [
        {
          name: "PRIMARY",
          fields: ["id"],
        },
      ]
    }
  )

  return position
}
