"use strict";

module.exports = (sequelize, DataTypes) => {
  let user = sequelize.define(
    "usersTbl",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      userType: {
        type: DataTypes.STRING,
        allowNull: false,
      },

      //ACCOUNT ACCESS
      viewAcct: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      addAcct: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editAcct: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delAcct: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },

      //PAY FREQUENCY ACCESS
      viewPayF: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      addPayF: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editPayF: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delPayF: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },

      //CLIENT ACCESS
      viewClient: {
        type: DataTypes.STRING,
        defaultValue: ''
      },
      addClient: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editClient: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delClient: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },

      //EMPLOYEE ACCESS
      viewEmp: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      addEmp: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editEmp: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delEmp: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },

      //CLASSIFICATION ACCESS
      viewClass: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      addClass: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editClass: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delClass: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },

      //DEPARTMENT ACCESS
      viewDept: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      addDept: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editDept: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delDept: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },

      //POSITION ACCESS
      viewPos: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      addPos: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editPos: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delPos: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },

      //LOCATION ACCESS
      viewLoc: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      addLoc: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editLoc: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delLoc: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },

      //WAGE ACCESS
      viewWage: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      addWage: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      editWage: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
      },
      delWage: {
        type: DataTypes.TINYINT(1),
        defaultValue: false
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
        }
      ],
    }
  );

  return user;
};
