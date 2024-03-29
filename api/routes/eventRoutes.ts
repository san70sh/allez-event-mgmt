import express from "express";
import redis from "redis";
import joi from "joi";
import { ObjectId } from "mongodb";
import xss from "xss";
import events from "../data/events.js";
import users from "../data/users.js";
import IEvent from "../models/events.model";
import { ErrorWithStatus } from "../types/global";
import { checkJwt } from "../middlewares/auth.js";
import { Request as JWTRequest } from "express-jwt";
import upload from "../middlewares/upload.js";

const router = express.Router();
const client = redis.createClient()


const eventValidationSchema: joi.ObjectSchema = joi.object({
  name: joi.string().required(),
  category: joi.array().required(),
  venue: {
    address: joi.string().required(),
    city: joi
      .string()
      .pattern(/^[a-z ,.'-]+$/i)
      .required(),
    state: joi
      .string()
      .pattern(/^[a-z ,.'-]+$/i)
      .required(),
    country: joi
      .string()
      .pattern(/^[a-z ,.'-]+$/i)
      .required(),
    zip: joi.number().required(),
    // geoLocation: {
    //   lat: joi.number().required(),
    //   long: joi.number().required(),
    // },
  },
  eventImg: joi.optional(),
  evt_stripeid: joi.string().optional(),
  payment_url: joi.string(),
  bookedSeats: joi.number().min(0),
  totalSeats: joi.number().min(0).required(),
  minAge: joi.number().required(),
  hostId: joi.string().required(),
  cohostArr: joi.array(),
  attendeesArr: joi.array(),
  description: joi.string().required(),
  price: joi.number().required().min(0),
  eventDate: joi.date().required().min("now"),
  eventStartTime: joi.string().required(),
  eventEndTime: joi.string().required()
});

router.post("/new", checkJwt, upload.single("eventImg"), async (req: JWTRequest, res: express.Response) => {
  try {
    const { body, auth } = req;
    const file = req.file as Express.MulterS3.File
    let eventDetails = body;
    if (auth && auth.sub) {
      let newEvent: IEvent = {
        name: xss(eventDetails.name.trim()),
        category: eventDetails.category,
        hostId: xss(eventDetails.hostId),
        evt_stripeid: undefined,
        payment_url: undefined,
        venue: {
          address: xss(eventDetails.venue.address.trim()),
          city: xss(eventDetails.venue.city.trim()),
          state: xss(eventDetails.venue.state.trim()),
          country: xss(eventDetails.venue.country.trim()),
          zip: Number(xss(eventDetails.venue.zip)),
          // geoLocation: {
          //   lat: Number(xss(eventDetails.venue.geoLocation.lat)),
          //   long: Number(xss(eventDetails.venue.geoLocation.long)),
          // },
        },
        minAge: Number(xss(eventDetails.minAge)),
        price: Number(xss(eventDetails.price)),
        description: xss(eventDetails.description),
        eventImg: file?.key,
        eventDate: xss(eventDetails.eventDate),
        eventStartTime: xss(eventDetails.eventStartTime),
        eventEndTime: xss(eventDetails.eventEndTime),
        totalSeats: Number(xss(eventDetails.totalSeats)),
        bookedSeats: Number(xss(eventDetails.bookedSeats)),
        cohostArr: [],
        attendeesArr: []
      };

      await eventValidationSchema.validateAsync(newEvent);
      console.log("Completed Validation")
      let createdEvent: IEvent | undefined = await events.createEvent(newEvent);
      if (createdEvent && createdEvent._id) {
        return res.status(200).send(createdEvent);
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
    console.log(e)
    return res.status(e.status).send(e.message);
  }
});

router.put("/:eventId", checkJwt, upload.single("eventImg"), async (req: JWTRequest, res: express.Response) => {
  try {
    const { body, auth } = req;
    const file = req.file as Express.MulterS3.File
    let event = body;
    let eventId: string = req.params.eventId;
    eventId = xss(eventId);
    if (!ObjectId.isValid(eventId)) {
      let err: ErrorWithStatus = {
        message: "Invalid Event ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
      return;
    }
    if (auth && auth.sub) {
      let existingEvent: IEvent = await events.getEventById(eventId);
      
      let modifiedEvent: IEvent = {
        name: xss(event.name.trim()),
        category: event.category,
        price: Number(xss(event.price)),
        hostId: xss(event.hostId),
        evt_stripeid: existingEvent.evt_stripeid,
        payment_url: event.payment_url,
        minAge: Number(xss(event.minAge)),
        description: xss(event.description),
        eventDate: xss(event.eventDate),
        bookedSeats: Number(xss(event.bookedSeats)),
        totalSeats: Number(xss(event.totalSeats)),
        eventStartTime: xss(event.eventStartTime),
        eventEndTime: xss(event.eventEndTime),
        cohostArr: existingEvent.cohostArr,
        attendeesArr: existingEvent.attendeesArr,
        eventImg: file?.key!,
        venue: {
          address: xss(event.venue.address.trim()),
          city: xss(event.venue.city.trim()),
          state: xss(event.venue.state.trim()),
          country: xss(event.venue.country.trim()),
          zip: Number(xss(event.venue.zip)),
          // geoLocation: {
          //   lat: event.venue.geoLocation.lat,
          //   long: event.venue.geoLocation.long,
          // },
        },
      };
      if (!req.file) {
        modifiedEvent.eventImg = existingEvent.eventImg
      }

      if(modifiedEvent.eventImg !== existingEvent.eventImg) {
        await events.removeImageFromStorage(existingEvent._id!.toString())
      }
      await eventValidationSchema.validateAsync(modifiedEvent);
      let updatedUser: IEvent | undefined = await events.modifyEvent(eventId, modifiedEvent);
      if (updatedUser) {
        return res.status(200).send(updatedUser);
      }
    }
  } catch (e: any) {
    console.log("L216: ", e);
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

router.get("/", async (req: express.Request, res: express.Response) => {
  let { eventsData, count } = await events.getAllEvents();
  if (count > 0) {
    return res.status(200).send(eventsData);
  } else {
    return res.send([]).status(200);
  }
});


router.get("/cache", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    let { auth } = req
    if (auth && auth.sub) {
      await client.connect();
      let eventList: string[] = await client.zRange(auth.sub, 0, 3)
      if (eventList && eventList.length > 0) {
        let eventPromises = eventList.map(eventId => events.getEventById(eventId))
        let eventArr = await Promise.all(eventPromises)
        await client.quit()
        return res.status(200).send(eventArr);
      } else {
        await client.quit()
        return res.send([]).status(200);
      }
    }
  } catch(e: any) {
    console.log(e)
    if(client.isOpen) {
      await client.quit()
    }
    return res.status(e.status).send(e.message);
  }
});

router.get("/:eventId", async (req: express.Request, res: express.Response) => {
  try {
    let id: string = xss(req.params.eventId);
    if (!ObjectId.isValid(req.params.eventId)) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid event ID",
        status: 400,
      };
      return res.status(err.status).send(err.message);
    }
    let getEventDetails = await events.getEventById(id);
    return res.status(200).send(getEventDetails);
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

router.get("/:eventId/cache", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    let id: string = xss(req.params.eventId);
    let { auth } = req
    console.log("Test")
    if (auth && auth.sub) {
      if (!ObjectId.isValid(req.params.eventId)) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, Invalid event ID",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }
      let getEventDetails = await events.getEventById(id);
      await client.connect()
      let eventExists = await client.zScore(auth.sub, id)
      console.log(eventExists)
      if (eventExists) {
        await client.zIncrBy(auth.sub, 1, id)
      } else {
        await client.zAdd(auth.sub, {score: 1, value: id})
        await client.sAdd(id, auth.sub)
      }
      await client.quit()
      return res.status(200).send(getEventDetails);
    }
  } catch (e: any) {
    console.log(e)
    if (client.isOpen) {
      await client.quit()
    }
    return res.status(e.status).send(e.message);
  }
});


router.delete("/:eventId", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { auth } = req;
    let id: string = xss(req.params.eventId);
    if (!ObjectId.isValid(req.params.eventId)) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid event ID",
        status: 400,
      };
      return res.status(err.status).send(err.message);
    }
    if (auth && auth.sub) {
      let deletedEvent = await events.deleteEvent(id, auth.sub);
      if (deletedEvent.deleted) {
        await client.connect();
        let authKeys = await client.sMembers(id)
        if(authKeys) {
          authKeys.forEach(async (key) => {
            await client.zRem(key, id)
          })
        }
        await Promise.all(authKeys)
        await client.quit()
        let authId = auth.sub.split("|")[1]
        let updatedUser = await users.removeHostedEvents(authId, id);
        if (updatedUser) {
          return res.status(200).send({deleted: true});
        }
      } else {
        return res.status(400).send({ deleted: false });
      }
    }
  } catch (e: any) {
    if (client.isOpen) {
      await client.quit()
    }
    return res.status(e.status).send(e.message);
  }
});

router.patch("/:eventId", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { auth, body } = req;
    let { cohostId, action } = body;
    let eventId = xss(req.params.eventId);

    if (auth && auth.sub) {

      let hostId: string = auth.sub;

      if (!cohostId) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, please select hostId",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }

      if (!ObjectId.isValid(cohostId)) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, Invalid host ID",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }

      if (!ObjectId.isValid(eventId)) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, Invalid event ID",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }

      if (!action) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, please select your action",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }
      cohostId = xss(cohostId);
      action = xss(action);
      let authId = cohostId.split("|")[1];

      let updatedEventWithCohost: IEvent;
      switch (action) {
        case "add":
          updatedEventWithCohost = await events.addCohost(eventId, cohostId, hostId);
          if (updatedEventWithCohost) {
            let updateUser = await users.addCohostedEvents(authId, eventId);
            if (updateUser) {
              return res.status(200).send({ addCohost: true });
            }
          }
          break;
        case "remove":
          updatedEventWithCohost = await events.removeCohost(eventId, cohostId, hostId);
          if (updatedEventWithCohost) {
            let updateUser = await users.removeCohostedEvents(authId, eventId);
            if (updateUser) {
              return res.status(200).send({ removeCohost: true });
            }
          }
          break;
        default:
          let err: ErrorWithStatus = {
            message: "Bad Parameters, invalid action",
            status: 400,
          };
          return res.status(err.status).send(err.message);
      }
    }
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

router.post("/stripe_webhook")

router.patch("/:eventId/registerEvent", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
    const { auth, body } = req;
    let { action } = body;
    let eventId = xss(req.params.eventId);

    if (auth && auth.sub) {
      let attendeeId: string = auth.sub.split("|")[1];
      if (!attendeeId) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, please select attendeeId",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }

      if (!ObjectId.isValid(attendeeId)) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, Invalid attendee ID",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }

      if (!ObjectId.isValid(eventId)) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, Invalid event ID",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }

      if (!action) {
        let err: ErrorWithStatus = {
          message: "Bad Parameters, please select your action",
          status: 400,
        };
        return res.status(err.status).send(err.message);
      }

      action = xss(action);
      let authId = attendeeId.split("|")[1];

      let updatedEventWithAttendee: IEvent;
      switch (action) {
        case "add":
          updatedEventWithAttendee = await events.addAttendee(eventId, attendeeId);
          if (updatedEventWithAttendee) {
            let updateUser = await users.addRegisteredEvents(authId, eventId);
            if (updateUser) {
              return res.status(200).send({ addAttendee: true });
            }
          }
          break;
        case "remove":
          updatedEventWithAttendee = await events.removeAttendee(eventId, attendeeId);
          if (updatedEventWithAttendee) {
            let updateUser = await users.removeRegisteredEvents(authId, eventId);
            if (updateUser) {
              return res.status(200).send({ removeAttendee: true });
            }
          }
          break;
        default:
          let err: ErrorWithStatus = {
            message: "Bad Parameters, invalid action",
            status: 400,
          };
          return res.status(err.status).send(err.message);
          break;
      }
    }
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

export default router;
