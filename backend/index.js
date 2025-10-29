import express from "express";
import bodyParser from "body-parser";
import dotenv from 'dotenv'
import { connect } from "mongoose";
import cors from 'cors';
import errorHandler from "./middleware/error-handler.js";
import config from './configs/env.js';
import ALL_ROUTES from "./routes/index.routes.js";



dotenv.config({ path: './' });

const app = express();

app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

//ROUTES TO BE POSTED HERE
app.use('/api', ALL_ROUTES)

app.use(errorHandler)

await connect(config.MONGODB_URI)
.then(() => console.log(`Server is connected in ${config.ENV} mode`))
.catch(err => console.log('Server connection error: ', err))

app.listen(config.PORT, (error) => {
  if(!error) {
    console.log(`Server connected at port ${config.PORT}`)
  }
})
