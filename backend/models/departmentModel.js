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
        type: DataTypes.INTEGER
      },
      deptCode: {
        type: DataTypes.STRING(50)
      },
      deptName: {
        type: DataTypes.STRING(100),
        allowNull: false
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
          name: 'PRIMARY',
          fields: ['id']
        }
      ]
    }
  )

  return department
}
