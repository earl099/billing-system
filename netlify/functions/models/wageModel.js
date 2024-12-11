"use strict"

module.exports = (sequelize, DataTypes) => {
  let wage = sequelize.define(
    'wageTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      wageName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      clientId: {
        type: DataTypes.INTEGER
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

  return wage
}
