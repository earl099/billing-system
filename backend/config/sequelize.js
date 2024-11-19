const dbConfig = require("./dbConfig");
const { Sequelize, DataTypes } = require("sequelize");

const db = {};

//** DATABASE CONFIGURATION **//
const sequelize = new Sequelize(dbConfig.db, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  operatorAliases: 0,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

//** DATABASE CONNECTION **/
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log("Error: " + err);
  });

db.Sequelize = Sequelize;
db.sequelize = sequelize;

//** DEFINE TABLES HERE **//
db.userModel = require("../models/userModel")(sequelize, DataTypes);
db.auditModel = require('../models/auditModel')(sequelize, DataTypes)
db.payFreqModel = require('../models/payFreqModel')(sequelize, DataTypes)
db.clientModel = require('../models/clientModel')(sequelize, DataTypes)
db.employeeModel = require('../models/employeeModel')(sequelize, DataTypes)
db.departmentModel = require('../models/departmentModel')(sequelize, DataTypes)
db.locationModel = require('../models/locationModel')(sequelize, DataTypes)
db.wageModel = require('../models/wageModel')(sequelize, DataTypes)
db.positionModel = require('../models/positionModel')(sequelize, DataTypes)
db.classificationModel = require('../models/classificationModel')(sequelize, DataTypes)
db.empStatusModel = require('../models/empStatusModel')(sequelize, DataTypes)
db.formerEmpModel = require('../models/formerEmpModel')(sequelize, DataTypes)

//** SYNC DATABASE HERE **//
try {
  db.sequelize
    .sync({ alter: true })
    .then(() => {
      console.log("Re-sync done.");
    })
    .catch((err) => {
      console.log(err);
    });
} catch (e) {
  console.log(e);
}

module.exports = db;
