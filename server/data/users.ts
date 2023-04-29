import IUser from "../models/users.model";
import { ErrorWithStatus } from "../types/global";
import { collections, events, users } from "../config/mongoCollections";
import joi from "joi";
import { ObjectId, UpdateResult, WithoutId } from "mongodb";
import IEvent from "../models/events.model";

const userValidationSchema: joi.ObjectSchema = joi.object({
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
  phone: joi.number().required(),
  address: {
    postal_code: joi.number().required(),
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
  },
  dateOfBirth: joi.date().required().min("1900-1-1").max("now"),
  hostEventArray: joi.array(),
  cohostEventArray: joi.array(),
  attendEventArray: joi.array(),
});

const validityCheck = (id: string | undefined, eventId: string | undefined) => {
  if (eventId && !ObjectId.isValid(eventId)) {
    let err: ErrorWithStatus = {
      message: "Invalid Event ID",
      status: 400,
    };
    throw err;
  }

  if (id && !ObjectId.isValid(id)) {
    let err: ErrorWithStatus = {
      message: "Invalid ID",
      status: 400,
    };
    throw err;
  }
}

async function createUser(person: IUser): Promise<IUser> {
  await userValidationSchema.validateAsync(person);
  let pId = person.authId.split("|")

  let newUser: IUser = {
    _id: new ObjectId(pId[1]),
    firstName: person.firstName.trim(),
    lastName: person.lastName.trim(),
    address: {
      city: person.address.city.trim(),
      state: person.address.state.trim(),
      postal_code: person.address.postal_code,
      country: person.address.country.trim(),
    },
    authId: person.authId,
    phone: Number(person.phone),
    gender: person.gender.trim(),
    email: person.email.trim(),
    dateOfBirth: person.dateOfBirth,
    hostEventArray: [],
    cohostEventArray: [],
    attendEventArray: [],
  };

  await users();
  let existingUser = await collections.users?.findOne({ email: newUser.email });
  if (!existingUser) {
    let insertedUser = await collections.users?.insertOne(newUser);
    if (insertedUser?.acknowledged == false) {
      let err: ErrorWithStatus = {
        message: "Unable to register user",
        status: 500,
      };
      throw err;
    } else {
      if (insertedUser?.insertedId) {
        return getUserById(pId[1]);
      } else {
        let err: ErrorWithStatus = {
          message: "Unable to retrieve userId",
          status: 404,
        };
        throw err;
      }
    }
  } else {
    let err: ErrorWithStatus = {
      message: "User already present in database",
      status: 400,
    };
    throw err;
  }
}

async function getUserById(authId: string): Promise<IUser> {
  validityCheck(authId, undefined);
  await users();
  let user: IUser | null | undefined = await collections.users?.findOne({ _id: new ObjectId(authId) });

  if (!user) {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
  user._id = user._id?.toString();
  return user;
}

async function modifyUser(person: IUser): Promise<IUser> {
  await userValidationSchema.validateAsync(person);

  let modifiedUser: IUser = {
    firstName: person.firstName.trim(),
    lastName: person.lastName.trim(),
    address: {
      city: person.address.city.trim(),
      state: person.address.state.trim(),
      postal_code: person.address.postal_code,
      country: person.address.country.trim(),
    },
    authId: person.authId,
    phone: Number(person.phone),
    gender: person.gender.trim(),
    email: person.email.trim(),
    dateOfBirth: person.dateOfBirth,
    hostEventArray: person.hostEventArray,
    cohostEventArray: person.cohostEventArray,
    attendEventArray: person.attendEventArray,
  };

  let authSplit: string[] = person.authId.split("|");
  let pId: ObjectId = new ObjectId(authSplit[1]);

  await users();
  let existingUser: IUser | null | undefined = await collections.users?.findOne({ _id: pId });
  if (existingUser) {
    let updatedUser = await collections.users?.updateOne(
      { _id: existingUser._id },
      {
        $set: {
          firstName: modifiedUser.firstName,
          lastName: modifiedUser.lastName,
          address: modifiedUser.address,
          phone: modifiedUser.phone,
          dateOfBirth: modifiedUser.dateOfBirth,
          // hostEventArray: modifiedUser.hostEventArray,
          // attendEventArray: modifiedUser.attendEventArray,
        },
      }
    );
    if (updatedUser?.modifiedCount == 0) {
      let err: ErrorWithStatus = {
        message: "Unable to register user",
        status: 500,
      };
      throw err;
    } else {
      return getUserById(pId.toString());
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
}

async function deleteUser(authId: string): Promise<{ deleted: Boolean }> {
  let id: string = authId.split("|")[1];
  validityCheck(id, undefined);
  let queryId: ObjectId = new ObjectId(id);
  await users();
  let existingUser: IUser | null | undefined = await collections.users?.findOne({ _id: queryId });
  if (existingUser) {
    // existingUser.hostEventArray.forEach(async (eventId: string) => {

    // })
    let deletedUser = await collections.users?.deleteOne({ _id: queryId });
    if (deletedUser?.acknowledged) {
      return { deleted: true };
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to delete user in database",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
}

async function addRegisteredEvents(auth: string, eventId: string): Promise<IUser> {

  validityCheck(auth, eventId);

  let queryId: ObjectId = new ObjectId(auth);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if (user) {
    let registeredUser: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $addToSet: {
        attendEventArray: eventId
      }
    });
    if (registeredUser && registeredUser.modifiedCount == 1) {
      return getUserById(auth);
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to register user in event",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
}

async function removeRegisteredEvents(auth: string, eventId: string): Promise<IUser> {
  validityCheck(auth, eventId);

  let queryId: ObjectId = new ObjectId(auth);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if (user) {
    let unregisteredUser: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $pull: {
        attendEventArray: eventId
      }
    });
    if (unregisteredUser && unregisteredUser.modifiedCount == 1) {
      return getUserById(auth);
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to remove user from event",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
}

async function addHostedEvents(auth: string, eventId: string): Promise<IUser> {
  validityCheck(auth, eventId);
  let queryId: ObjectId = new ObjectId(auth);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if (user) {
    let registeredUser: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $addToSet: {
        hostEventArray: eventId
      }
    });

    if (registeredUser && registeredUser.modifiedCount == 1) {
      let user: IUser = await getUserById(auth);
      return user;
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to host user in event",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
}

async function removeHostedEvents(auth: string, eventId: string): Promise<IUser> {
  validityCheck(auth, eventId);

  let queryId: ObjectId = new ObjectId(auth);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if (user) {
    let removeHost: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $pull: {
        hostEventArray: eventId
      }
    });
    if (removeHost && removeHost.modifiedCount == 1) {
      return getUserById(auth);
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to remove host from event",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
}

async function addCohostedEvents(auth: string, eventId: string): Promise<IUser> {
  validityCheck(auth, eventId);

  let queryId: ObjectId = new ObjectId(auth);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if (user) {
    let registeredUser: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $addToSet: {
        cohostEventArray: eventId
      }
    });
    if (registeredUser && registeredUser.modifiedCount == 1) {
      return getUserById(auth);
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to add user as cohost in event",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
}

async function removeCohostedEvents(auth: string, eventId: string): Promise<IUser> {
  validityCheck(auth, eventId);

  let queryId: ObjectId = new ObjectId(auth);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if (user) {
    let removeHost: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $pull: {
        cohostEventArray: eventId
      }
    });
    if (removeHost && removeHost.modifiedCount == 1) {
      return getUserById(auth);
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to remove cohost from event",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 404,
    };
    throw err;
  }
}

async function getRegisteredEvents(id: string): Promise<{ events: IEvent[]; count: Number }> {
  validityCheck(id, undefined);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let registeredDocs: WithoutId<IUser> | null | undefined = await collections.users?.findOne(
    { _id: queryId },
    {
      projection: {
        attendEventArray: 1,
      },
    }
  );

  console.log(registeredDocs);
  let eventArr: IEvent[] | undefined = [];

  if (registeredDocs && registeredDocs.attendEventArray.length > 0) {
    let registeredEventIds: ObjectId[] = [];
    registeredDocs.hostEventArray.forEach((eId) => {
      let parsedId: ObjectId = new ObjectId(eId);
      registeredEventIds.push(parsedId);
    });
    eventArr = await collections.events
      ?.find(
        { _id: { $in: registeredEventIds } }
      )
      .toArray();
  }

  if (eventArr && eventArr?.length > 0) {
    return { events: eventArr, count: eventArr.length };
  } else {
    return { events: [], count: 0 };
  }
}

async function getHostedEvents(id: string): Promise<{ events: IEvent[]; count: Number }> {
  validityCheck(id, undefined);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  
  if (!collections.events) {
    await events();
  }
  let hostDocs: WithoutId<IUser> | null | undefined = await collections.users?.findOne(
    { _id: queryId },
    {
      projection: {
        hostEventArray: 1,
      },
    }
  );

  console.log(hostDocs);
  let eventArr: IEvent[] | undefined = [];

  if (hostDocs && hostDocs.hostEventArray.length > 0) {
    let hostedEventIds: ObjectId[] = [];
    hostDocs.hostEventArray.forEach((eId) => {
      let parsedId: ObjectId = new ObjectId(eId);
      hostedEventIds.push(parsedId);
    });
    eventArr = await collections.events
      ?.find(
        { _id: { $in: hostedEventIds } }
      )
      .toArray();
  }

  if (eventArr && eventArr?.length > 0) {
    return { events: eventArr, count: eventArr.length };
  } else {
    return { events: [], count: 0 };
  }
}

async function getCohostedEvents(id: string): Promise<{ events: IEvent[]; count: Number }> {
  validityCheck(id, undefined);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let cohostDocs: WithoutId<IUser> | null | undefined = await collections.users?.findOne(
    { _id: queryId },
    {
      projection: {
        cohostEventArray: 1,
      },
    }
  );

  console.log(cohostDocs);
  let eventArr: IEvent[] | undefined = [];

  if (cohostDocs && cohostDocs.cohostEventArray.length > 0) {
    let cohostedEventIds: ObjectId[] = [];
    cohostDocs.cohostEventArray.forEach((eId) => {
      let parsedId: ObjectId = new ObjectId(eId);
      cohostedEventIds.push(parsedId);
    });
    eventArr = await collections.events
      ?.find(
        { _id: { $in: cohostedEventIds } }
      )
      .toArray();
  }

  if (eventArr && eventArr?.length > 0) {
    return { events: eventArr, count: eventArr.length };
  } else {
    return { events: [], count: 0 };
  }
}

export default {
  getUserById,
  createUser,
  modifyUser,
  deleteUser,
  addHostedEvents,
  addRegisteredEvents,
  removeHostedEvents,
  removeRegisteredEvents,
  addCohostedEvents,
  removeCohostedEvents,
  getHostedEvents,
  getCohostedEvents,
  getRegisteredEvents,
};
