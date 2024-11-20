"use strict"

module.exports = (sequelize, DataTypes) => {
  let formerEmp = sequelize.define(
    'formerEmpTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      empId: {
        type: DataTypes.INTEGER
      },
      position: {
        type: DataTypes.STRING
      },
      otherInfo: {
        type: DataTypes.STRING
      },
      dateStarted: {
        type: DataTypes.DATEONLY
      },
      dateEnded: {
        type: DataTypes.DATEONLY
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

  return formerEmp
}
