//imports for .env file generation and jwt secret key generation
require("dotenv").config();
const fs = require("fs");
const crypto = require("crypto");
const keyMaker = crypto.randomBytes(32).toString("hex");

//imports for creating the database
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
// require("dotenv").config({ path: "./.env" });
const app = express();

// .env variables

// const envVariables = `
// DATABASE=sql12752333
// USER=sql12752333
// PASSWORD=vWVauBc6vJ
// HOST=sql12.freesqldatabase.com
// PORT=3000
// JWT_PRIVATE_KEY=${keyMaker}
// JWT_LOGIN_TOKEN=
// `;

const envVariables = `
API_ROOT=https://billing-system-dolz.onrender.com/api
DATABASE=sql12752313
USER=sql12752313
PASSWORD=dqJhj4bX1L
HOST=sql12.freesqldatabase.com
PORT=3000
JWT_PRIVATE_KEY=${keyMaker}
JWT_LOGIN_TOKEN=
`;
// .env file creation
fs.access(".env", fs.constants.F_OK, (err) => {
  if (err) {
    fs.writeFile(".env", envVariables.trim(), (err) => {
      if (err) {
        console.log("Error writing .env file.", err);
      } else {
        console.log(".env file created successfully.");
      }
    });
  } else {
    console.log(".env file exists.");
  }
});

//database creation
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const port = process.env.port || 3000;

//** BACKEND ROUTES GO HERE **/

//user routes
const userRouter = require("./routers/userRoutes");
app.use("/api", userRouter);

//audit routes
const auditRouter = require("./routers/auditRoutes");
app.use("/api", auditRouter);

//client routes
const clientRouter = require("./routers/clientRoutes");
app.use("/api", clientRouter);

//employee routes
const employeeRouter = require("./routers/employeeRoutes");
app.use("/api", employeeRouter);

//pay frequency routes
const payFreqRouter = require("./routers/payFreqRoutes");
app.use("/api", payFreqRouter);

//position routes
const positionRoutes = require("./routers/positionRoutes");
app.use("/api", positionRoutes);

//classification routes
const classificationRoutes = require("./routers/classificationRoutes");
app.use("/api", classificationRoutes);

//department routes
const deptRoutes = require("./routers/departmentRoutes");
app.use("/api", deptRoutes);

//wage routes
const wageRoutes = require("./routers/wageRoutes");
app.use("/api", wageRoutes);

//location routes
const locationRoutes = require("./routers/locationRoutes");
app.use("/api", locationRoutes);

//employment status routes
const empStatusRoutes = require("./routers/empStatusRoutes");
app.use("/api", empStatusRoutes);

app.listen(port, () => {
  console.log("Server is running on port", port);
});
