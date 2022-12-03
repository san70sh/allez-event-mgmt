import express from "express";
import IUser from "../models/users.model";
import xss from "xss";
import users from "../data/users";
import { ErrorWithStatus } from "../types/global";
import joi from "joi";
import { ObjectId } from "mongodb";

const router = express.Router();

const loginSchema = joi.object({
  email: joi
    .string()
    .pattern(/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/)
    .required(),
  password: joi.string().required(),
});

const userValidationSchema = joi.object({
  name: joi
    .string()
    .pattern(/^[a-z ,.'-]+$/i)
    .min(6)
    .required(),
  gender: joi
    .string()
    .pattern(/^(?:m|M|male|Male|f|F|female|Female)$/)
    .required(),
  email: joi
    .string()
    .pattern(/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/)
    .required(),
  phone: joi
    .string()
    .length(10)
    .pattern(/^[0-9]+$/)
    .required(),
  address: {
    postal_code: joi.string().length(5).required(),
    city: joi.string().pattern(/[a-z]/i).required(),
    state: joi
      .string()
      .pattern(/^[a-z ,.'-]+$/i)
      .required(),
    country: joi
      .string()
      .pattern(/^[a-z ,.'-]+$/i)
      .required(),
  },
  dateOfBirth: joi.date().required().min("1900-1-1").max("now"),
  hostEventArray: joi.optional(),
  attendEventArray: joi.optional(),
});

router.post("/signup", async (req: express.Request, res: express.Response) => {
  try {
    let { user, password } = req.body;
    await userValidationSchema.validateAsync(user);

    if (!password || password.trim().length == 0) {
      let err: ErrorWithStatus = {
        message: "Please enter a valid password",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }

    let newUser: IUser = {
      name: xss(user.name.trim()),
      address: {
        city: xss(user.address.city.trim()),
        state: xss(user.address.state.trim()),
        postal_code: Number(xss(user.address.postal_code)),
        country: xss(user.address.country.trim()),
      },
      phone: Number(xss(user.phone)),
      gender: xss(user.gender.trim()),
      email: xss(user.email.trim().toLowerCase()),
      dateOfBirth: xss(user.dateOfBirth),
      hostEventArray: [],
      cohostEventArray: [],
      attendEventArray: [],
    };

    let createdUser: IUser | undefined = await users.createUser(newUser);
    if (createdUser) {
      res.status(200).send(createdUser);
    }
  } catch (e: any) {
    console.log("L177: ", e);
    if (e.isJoi) {
      let err: ErrorWithStatus = {
        message: `${e.details[0].message}`,
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    res.status(e.status).send(e.message);
  }
});

router.put("/", async (req: express.Request, res: express.Response) => {
  try {
    let user = req.body;
    console.log(user);
    await userValidationSchema.validateAsync(user);

    let modifiedUser: IUser = {
      name: xss(user.name.trim()),
      address: {
        city: xss(user.address.city.trim()),
        state: xss(user.address.state.trim()),
        postal_code: Number(xss(user.address.postal_code)),
        country: xss(user.address.country.trim()),
      },
      phone: Number(xss(user.phone)),
      gender: xss(user.gender.trim()),
      email: xss(user.email.trim().toLowerCase()),
      dateOfBirth: xss(user.dateOfBirth),
      hostEventArray: user.hostEventArray,
      cohostEventArray: user.cohostEventArray,
      attendEventArray: user.attendEventArray,
    };

    let updatedUser: IUser | undefined = await users.modifyUser(modifiedUser);
    if (updatedUser) {
      res.status(200).send(updatedUser);
    }
  } catch (e: any) {
    console.log("L216: ", e);
    if (e.isJoi) {
      let err: ErrorWithStatus = {
        message: `${e.details[0].message}`,
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    res.status(e.status).send(e.message);
  }
});

// router.post("/login", async(req, res) => {
//   try {
//     let reqBody = req.body;
//     await loginSchema.validateAsync(reqBody);

//   } catch(e: any) {
//     if(e.isJoi) {
//       let err: ErrorWithStatus = {
//         message: `${e.details[0].message}`,
//         status: 400,
//       };
//       res.status(err.status).send(err.message);
//     }
//     res.status(e.status).send(e.message);
//   }
// })

router.get("/:userId", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.userId.toString())) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid user ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    let id: string = xss(req.params.userId);
    let getUserDetails = await users.getUserById(id);
    res.status(200).send(getUserDetails);
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

router.get("/:userId/hostedEvents", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.userId.toString())) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid user ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    let id: string = xss(req.params.userId);
    let getUserHostedEvents = await users.getHostedEvents(id);
    res.status(200).send(getUserHostedEvents);
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

router.get("/:userId/cohostedEvents", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.userId.toString())) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid user ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    let id: string = xss(req.params.userId);
    let getUserCohostedEvents = await users.getCohostedEvents(id);
    res.status(200).send(getUserCohostedEvents);
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

router.get("/:userId/registeredEvents", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.userId.toString())) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid user ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    let id: string = xss(req.params.userId);
    let getUserRegisteredEvents = await users.getRegisteredEvents(id);
    res.status(200).send(getUserRegisteredEvents);
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

router.delete("/:userId", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.userId.toString())) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid user ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    let id: string = xss(req.params.userId);
    let deleteUser = await users.deleteUser(id);
    res.status(200).send(deleteUser);
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

export default router;
