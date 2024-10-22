"use strict"

module.exports = (sequelize, DataTypes) => {
  let location = sequelize.define(
    'locationTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      deptId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      locName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      type: {
        type: DataTypes.STRING(10)
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

  return location
}
