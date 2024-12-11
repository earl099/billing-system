"use strict"

module.exports = (sequelize, DataTypes) => {
  let empStatus = sequelize.define(
    'empStatusTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      empStatusName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false
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

  return empStatus
}
