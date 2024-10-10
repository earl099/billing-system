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
      posName: {
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

  return position
}
