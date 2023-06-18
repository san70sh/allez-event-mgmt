import express, { Application } from "express";
import configRoutes from "./routes/index.js";
import cors from "cors";
import { join } from "path";
// import dbConnection from "./config/mongoConnection";
import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv"

const credentials = './cert/X509-cert-7185957328460949904.pem'

dotenv.config()

const app = express();
const buildApp = async (app: Application) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: true, credentials: true }));
  // app.get("/auth_config.json", (req, res) => {
  //   res.sendFile(join(__dirname, "auth_config.json"));
  // });

  app.use("*", (req, res, next) => {
    console.log("Incoming URL: " + req.url + " " + req.method + " " + new Date() + " ");
    next();
  });

  MongoClient.connect(process.env.MONGO_URL!, {
    sslKey: credentials,
    sslCert: credentials,
    serverApi: ServerApiVersion.v1,
  }).then(() => {
    console.log("Connected to db")
  })

  configRoutes(app);
  app.listen(process.env.PORT || 3000, () => {
    console.log("We've now got a server!");
    // console.log('Your routes will be running on http://localhost:3000');
  });

}

buildApp(app);