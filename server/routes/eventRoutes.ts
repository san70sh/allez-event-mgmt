import express from "express";
import joi from "joi";
import { ObjectId } from "mongodb";
import xss from "xss";
import events from "../data/events";
import users from "../data/users";
import IEvent from "../models/events.model";
import { ErrorWithStatus } from "../types/global";
import { checkJwt } from "../auth/auth";
import { Request as JWTRequest } from "express-jwt";


const router = express.Router();

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
    geoLocation: {
      lat: joi.number().required(),
      long: joi.number().required(),
    },
  },
  eventImgs: joi.array().optional(),
  bookedSeats: joi.number().min(0).required(),
  totalSeats: joi.number().min(0).required(),
  minAge: joi.number().required(),
  hostId: joi.string().required(),
  cohostArr: joi.array(),
  attendeesArr: joi.array(),
  description: joi.string().required(),
  price: joi.number().required().min(0),
  eventDate: joi.date().required().min("now"),
});

router.post("/new", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
      const { body, auth } = req;
      let eventDetails = body;
      console.log(eventDetails)
      if (auth && auth.sub) {

        let eventImages: string[] = [];
        let newEvent: IEvent = {
          name: xss(eventDetails.name.trim()),
          category: eventDetails.category,
          hostId: xss(eventDetails.hostId),       //to remove once session is implemented
          venue: {
            address: xss(eventDetails.venue.address.trim()),
            city: xss(eventDetails.venue.city.trim()),
            state: xss(eventDetails.venue.state.trim()),
            country: xss(eventDetails.venue.country.trim()),
            zip: Number(xss(eventDetails.venue.zip)),
            geoLocation: {
              lat: Number(xss(eventDetails.venue.geoLocation.lat)),
              long: Number(xss(eventDetails.venue.geoLocation.long)),
            },
          },
          minAge: Number(xss(eventDetails.minAge)),
          price: Number(xss(eventDetails.price)),
          description: xss(eventDetails.description),
          eventImgs: eventImages,
          eventDate: xss(eventDetails.eventDate),
          totalSeats: Number(xss(eventDetails.totalSeats)),
          bookedSeats: Number(xss(eventDetails.bookedSeats)),
          cohostArr: [],
          attendeesArr: [],
        };
  
        await eventValidationSchema.validateAsync(newEvent);
  
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
    return res.status(e.status).send(e.message);
  }
});

router.put("/:eventId", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
      const { body, auth } = req;
      
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
      if(auth && auth.sub) {

        let modifiedEvent: IEvent = {
          name: xss(event.name.trim()),
          category: event.category,
          price: event.price,
          hostId: event.hostId,
          minAge: event.minAge,
          description: event.description,
          eventDate: event.eventDate,
          bookedSeats: event.bookedSeats,
          totalSeats: event.totalSeats,
          cohostArr: event.cohostArr,
          attendeesArr: event.attendeesArr,
          eventImgs: event.eventImgs,
          venue: {
            address: event.venue.address,
            city: event.venue.city,
            state: event.venue.state,
            country: event.venue.country,
            zip: event.venue.zip,
            geoLocation: {
              lat: event.venue.geoLocation.lat,
              long: event.venue.geoLocation.long,
            },
          },
        };
  
        await eventValidationSchema.validateAsync(event);
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
    return res.send("No Events Available").status(200);
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
      if(auth && auth.sub) {
        let authId = auth.sub.split("|")[1];
        let deletedEvent = await events.deleteEvent(id, authId);
        if (deletedEvent.deleted) {
          let updatedUser = await users.removeHostedEvents(authId, id);
          if (updatedUser) {
            return res.status(200).send(deletedEvent);
          }
        } else {
          return res.status(400).send({ deleted: false });
        }
      }
  } catch (e: any) {
    return res.status(e.status).send(e.message);
  }
});

router.patch("/:eventId", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
      const {auth, body } = req;
      let { cohostId, action } = body;
      let eventId = xss(req.params.eventId);

      if(auth && auth.sub) {

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

router.patch("/:eventId/registerEvent", checkJwt, async (req: JWTRequest, res: express.Response) => {
  try {
      const {auth, body} = req;
      let { action } = body;
      let eventId = xss(req.params.eventId);

      if(auth && auth.sub) {
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
