"use strict"

module.exports = (sequelize, DataTypes) => {
  let department = sequelize.define(
    'departmentTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      clientId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      deptName: {
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
          name: 'PRIMARY',
          fields: ['id']
        }
      ]
    }
  )

  return department
}
