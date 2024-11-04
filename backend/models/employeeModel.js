"use strict"

module.exports = (sequelize, DataTypes) => {
  let employee = sequelize.define(
    'employeeTbl',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      employeeId: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      middleName: {
        type: DataTypes.STRING(50)
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      suffix: {
        type: DataTypes.STRING
      },
      gender: {
        type: DataTypes.STRING(6)
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY
      },
      education: {
        type: DataTypes.STRING(100)
      },
      email1: {
        type: DataTypes.STRING(100)
      },
      email2: {
        type: DataTypes.STRING(100)
      },
      mobileNum1: {
        type: DataTypes.STRING(20)
      },
      mobileNum2: {
        type: DataTypes.STRING(20)
      },
      civilStatus: {
        type: DataTypes.STRING
      },
      clientId: {
        type: DataTypes.INTEGER,
      },
      classId: {
        type: DataTypes.INTEGER,
      },
      deptId: {
        type: DataTypes.INTEGER
      },
      locId: {
        type: DataTypes.INTEGER
      },
      posId: {
        type: DataTypes.INTEGER
      },
      empStatusId: {
        type: DataTypes.INTEGER
      },
      wageId: {
        type: DataTypes.INTEGER
      },
      remarks: {
        type: DataTypes.STRING
      },
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

  return employee
}
