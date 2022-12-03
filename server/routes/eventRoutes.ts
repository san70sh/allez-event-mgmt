import express from "express";
import joi from "joi";
import { ObjectId } from "mongodb";
import xss from "xss";
import events from "../data/events";
import users from "../data/users";
import IEvent from "../models/events.model";
import { ErrorWithStatus } from "../types/global";

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
  eventTimeStamp: joi.date().required().min("now"),
});

router.post("/new", async (req: express.Request, res: express.Response) => {
  try {
    let eventDetails = req.body;
    let eventImages: string[] = [];

    let newEvent: IEvent = {
      name: xss(eventDetails.name.trim()),
      category: eventDetails.category,
      hostId: xss(eventDetails.hostId),
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
      eventTimeStamp: xss(eventDetails.eventTimeStamp),
      totalSeats: Number(xss(eventDetails.totalSeats)),
      bookedSeats: Number(xss(eventDetails.bookedSeats)),
      cohostArr: [],
      attendeesArr: [],
    };

    await eventValidationSchema.validateAsync(newEvent);

    let createdEvent: IEvent | undefined = await events.createEvent(newEvent);
    if (createdEvent && createdEvent._id) {
      let updatedUser = await users.addHostedEvents(createdEvent.hostId, createdEvent._id?.toString());
      if (updatedUser) {
        res.status(200).send(createdEvent);
      }
    }
  } catch (e: any) {
    console.log("L87: ", e);
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

router.put("/:eventId", async (req: express.Request, res: express.Response) => {
  try {
    let event = req.body;
    console.log(event);

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

    let modifiedEvent: IEvent = {
      name: xss(event.name.trim()),
      category: event.category,
      price: event.price,
      hostId: event.hostId,
      minAge: event.minAge,
      description: event.description,
      eventTimeStamp: event.eventTimeStamp,
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

router.get("/", async (req: express.Request, res: express.Response) => {
  let { eventsData, count } = await events.getAllEvents();
  if (count > 0) {
    res.status(200).send(eventsData);
  } else {
    res.send("No Events Available").status(200);
  }
});

router.get("/:eventId", async (req: express.Request, res: express.Response) => {
  try {
    if (!ObjectId.isValid(req.params.eventId.toString())) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid event ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    let id: string = xss(req.params.eventId);
    let getEventDetails = await events.getEventById(id);
    res.status(200).send(getEventDetails);
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

router.delete("/:eventId", async (req: express.Request, res: express.Response) => {
  try {
    if (!ObjectId.isValid(req.params.eventId.toString())) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid event ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    let id: string = xss(req.params.eventId);
    let deletedEvent = await events.deleteEvent(id);
    if(deletedEvent.deleted) {
      let updatedUser = await users.removeHostedEvents('todo', id);
      if(updatedUser) {
        res.status(200).send(deletedEvent);

      }
    } else {
      res.status(400).send({deleted: false});
    }
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

router.patch("/:eventId", async (req: express.Request, res: express.Response) => {
  try {
    let { cohostId, action } = req.body;
    let eventId = xss(req.params.eventId);

    if (!cohostId) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, please select hostId",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }

    if (!ObjectId.isValid(cohostId)) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid host ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }

    if (!ObjectId.isValid(eventId)) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid event ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }

    if (!action) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, please select your action",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    cohostId = xss(cohostId);
    action = xss(action);

    let updatedEventWithCohost: IEvent;
    switch (action) {
      case "add":
        updatedEventWithCohost = await events.addCohost(eventId, cohostId);
        if (updatedEventWithCohost) {
          let updateUser = await users.addCohostedEvents(cohostId, eventId);
          if (updateUser) {
            res.status(200).send({ addCohost: true });
          }
        }
        break;
      case "remove":
        updatedEventWithCohost = await events.removeCohost(eventId, cohostId);
        if (updatedEventWithCohost) {
          let updateUser = await users.removeCohostedEvents(cohostId, eventId);
          if (updateUser) {
            res.status(200).send({ removeCohost: true });
          }
        }
        break;
      default:
        let err: ErrorWithStatus = {
          message: "Bad Parameters, invalid action",
          status: 400,
        };
        res.status(err.status).send(err.message);
        break;
    }
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

router.patch("/:eventId/registerEvent", async (req: express.Request, res: express.Response) => {
  try {
    let { attendeeId, action } = req.body;
    let eventId = xss(req.params.eventId);

    if (!attendeeId) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, please select attendeeId",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }

    if (!ObjectId.isValid(attendeeId)) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid attendee ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }

    if (!ObjectId.isValid(eventId)) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, Invalid event ID",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }

    if (!action) {
      let err: ErrorWithStatus = {
        message: "Bad Parameters, please select your action",
        status: 400,
      };
      res.status(err.status).send(err.message);
    }
    attendeeId = xss(attendeeId);
    action = xss(action);

    let updatedEventWithCohost: IEvent;
    switch (action) {
      case "add":
        updatedEventWithCohost = await events.addAttendee(eventId, attendeeId);
        if (updatedEventWithCohost) {
          let updateUser = await users.addRegisteredEvents(attendeeId, eventId);
          if (updateUser) {
            res.status(200).send({ addAttendee: true });
          }
        }
        break;
      case "remove":
        updatedEventWithCohost = await events.removeAttendee(eventId, attendeeId);
        if (updatedEventWithCohost) {
          let updateUser = await users.removeRegisteredEvents(attendeeId, eventId);
          if (updateUser) {
            res.status(200).send({ removeAttendee: true });
          }
        }
        break;
      default:
        let err: ErrorWithStatus = {
          message: "Bad Parameters, invalid action",
          status: 400,
        };
        res.status(err.status).send(err.message);
        break;
    }
  } catch (e: any) {
    res.status(e.status).send(e.message);
  }
});

export default router;
