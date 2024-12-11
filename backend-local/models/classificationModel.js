"use strict"

module.exports = (sequelize, DataTypes) => {
  let classification = sequelize.define(
    'classificationTbl',
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
        allowNull: false,
      },
      className: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      description: {
        type: DataTypes.STRING
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

  return classification
}
