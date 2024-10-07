"use strict"

module.exports = (sequelize, DataTypes) => {
  let client = sequelize.define(
    'clientTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      clientCode: {
        type: DataTypes.STRING,
        allowNull: false
      },
      payFrequencyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      clientName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false
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

  return client
}
