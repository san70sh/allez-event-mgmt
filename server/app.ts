import express from "express";
import configRoutes from "./routes";
import cors from "cors";
import {join} from "path";
// import session from "express-session";

const userRegex = "^\/users(\/login|\/signup)?(\/)?$";
let shouldAuthenticate = true;

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({origin: true, credentials: true}));

app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// app.use(session({
//   name: "AuthCookie",
//   secret: "AllezSessCookie",
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     maxAge: 5000
//   }
// }))

app.use("*", (req, res, next) => {
  console.log("Incoming URL: " + req.url + " " + req.method + " " + new Date() + " ");
  next();
});



app.post(userRegex, (req, res, next) => {
  // if(req.session.userId)
  //     return res.status(401).json({ "success": false, "result": 'user is already logged in.'});
  // shouldAuthenticate = false;
  next();
});

configRoutes(app);

app.listen(3000, () => {
    console.log("We've now got a server!");
    console.log('Your routes will be running on http://localhost:3000');
  });