import express from "express";
import IUser from "../models/users.model";
import xss from "xss";
import users from "../data/users";
import { ErrorWithStatus } from "../types/global";
import joi from "joi";
// import jwtAuthz from "express-jwt-authz";
import { checkJwt } from "../auth/auth";
import { Request as JWTRequest } from "express-jwt";


const router = express.Router();

const userValidationSchema = joi.object({
  firstName: joi
    .string()
    .pattern(/^[a-z]+$/i)
    .min(1)
    .required(),
  lastName: joi
    .string()
    .pattern(/^[a-z]+$/i)
    .min(1)
    .required(),
  gender: joi
    .string()
    .pattern(/^(?:Male|Female|Other)$/)
    .required(),
  email: joi
    .string()
    .pattern(/[a-z0-9]+@[a-z]+\.[a-z]{2,3}/)
    .required(),
  authId: joi.string().required(),
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

router.post("/signup", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { body, auth } = req;
    const { user } = body;
    await userValidationSchema.validateAsync(user);

    if (auth && auth.sub) {
      let newUser: IUser = {
        firstName: xss(user.firstName.trim()),
        lastName: xss(user.lastName.trim()),
        address: {
          city: xss(user.address.city.trim()),
          state: xss(user.address.state.trim()),
          postal_code: Number(xss(user.address.postal_code)),
          country: xss(user.address.country.trim()),
        },
        authId: xss(auth?.sub),
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
        return res.status(200).send(createdUser);
      }
    }
  } catch (e: any) {
    console.log("L177: ", e);
    if (e.isJoi) {
      let err: ErrorWithStatus = {
        message: `${e.details[0].message}`,
        status: 400,
      };
      return res.status(err.status).send(err.message);
    }
    return res.status(e.status).send(e.message);
  }
});

router.put("/",checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { body, auth } = req;
    const { user } = body;
    await userValidationSchema.validateAsync(user);

    if (auth && auth.sub) {
      let modifiedUser: IUser = {
        firstName: xss(user.firstName.trim()),
        lastName: xss(user.lastName.trim()),
        address: {
          city: xss(user.address.city.trim()),
          state: xss(user.address.state.trim()),
          postal_code: Number(xss(user.address.postal_code)),
          country: xss(user.address.country.trim()),
        },
        authId: xss(auth.sub),
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
        return res.status(200).send(updatedUser);
      }

    }
  } catch (e: any) {
    if (e.isJoi) {
      let err: ErrorWithStatus = {
        message: `${e.details[0].message}`,
        status: 400,
      };
      return res.status(err.status).send(err.message);
    }
    return res.status(e.status).send(e.message);
  }
});

router.get("/", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { auth } = req;
    if (auth && auth.sub) {
      let authId: string = auth.sub.split("|")[1];
      let getUserDetails = await users.getUserById(authId);
      return res.status(200).send(getUserDetails);

    }
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

router.get("/hostedEvents", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { auth } = req;
    if (auth && auth.sub) {
      let getUserHostedEvents = await users.getHostedEvents(auth.sub);
      return res.status(200).send(getUserHostedEvents);

    }
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

router.get("/cohostedEvents", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { auth } = req;
    if (auth && auth.sub) {
      let getUserCohostedEvents = await users.getCohostedEvents(auth.sub);
      return res.status(200).send(getUserCohostedEvents);
    }
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

router.get("/registeredEvents", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { auth } = req;
    if (auth && auth.sub) {
      let getUserRegisteredEvents = await users.getRegisteredEvents(auth.sub);
      return res.status(200).send(getUserRegisteredEvents);
    }
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

router.delete("/", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { auth } = req;
    if (auth && auth.sub) {
      let deleteUser = await users.deleteUser(auth.sub);
      return res.status(200).send(deleteUser);
    }
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

export default router;
