import IUser from "../models/users.model";
import { ErrorWithStatus } from "../types/global";
import { collections, users } from "../config/mongoCollections";
import joi from "joi";
import { ObjectId, UpdateResult, WithoutId } from "mongodb";
import IEvent from "../models/events.model";

const userValidationSchema: joi.ObjectSchema = joi.object({
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
      message: "Invalid User ID",
      status: 400,
    };
    throw err;
  }
}

async function createUser(person: IUser): Promise<IUser> {
  // if (
  //   typeof person.name != "string" ||
  //   typeof person.gender != "string" ||
  //   typeof person.email != "string" ||
  //   typeof person.address.city != "string" ||
  //   typeof person.address.state != "string" ||
  //   typeof person.address.postal_code != "string" ||
  //   typeof person.address.country != "string"
  // ) {
  //   let error: ErrorWithStatus = {
  //     message: "Registration Details Not In String Format",
  //     status: 400,
  //   };
  //   throw error;
  // }

  // if (
  //   !person.name.trim() ||
  //   !person.gender.trim() ||
  //   !person.email.trim() ||
  //   !person.address.city.trim() ||
  //   !person.address.state.trim() ||
  //   !person.address.postal_code ||
  //   !person.address.country.trim()
  // ) {
  //   let error: ErrorWithStatus = {
  //     message: "Registration Details Might Be Empty Strings",
  //     status: 400,
  //   };
  //   throw error;
  // }

  // if (isNaN(Number(person.phone))) {
  //   let error: ErrorWithStatus = {
  //     message: "Phone Number Is Not Number",
  //     status: 400,
  //   };
  //   throw error;
  // }
  // if (isNaN(Number(person.address.postal_code))) {
  //   let error: ErrorWithStatus = {
  //     message: "ZIP Is Not Number",
  //     status: 400,
  //   };
  //   throw error;
  // }
  // if (
  //   !isNaN(Number(person.name)) ||
  //   !isNaN(Number(person.address.city)) ||
  //   !isNaN(Number(person.address.state)) ||
  //   !isNaN(Number(person.address.country)) ||
  //   !isNaN(Number(person.gender)) ||
  //   !isNaN(Number(person.email))
  // ) {
  //   let error: ErrorWithStatus = {
  //     message: "Any Detail Of The User Might Be A Number Which Require To Be A String",
  //     status: 400,
  //   };
  //   throw error;
  // }

  await userValidationSchema.validateAsync(person);

  let newUser: IUser = {
    name: person.name.trim(),
    address: {
      city: person.address.city.trim(),
      state: person.address.state.trim(),
      postal_code: person.address.postal_code,
      country: person.address.country.trim(),
    },
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
        return getUserById(insertedUser?.insertedId.toString());
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

async function getUserById(insertedId: string): Promise<IUser> {
  validityCheck(insertedId, undefined);

  await users();
  let queryId: ObjectId = new ObjectId(insertedId);

  let user: IUser | null | undefined = await collections.users?.findOne({ _id: queryId });

  if (!user) {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 400,
    };
    throw err;
  }

  user._id = user._id?.toString();
  return user;
}

async function modifyUser(person: IUser): Promise<IUser> {
  await userValidationSchema.validateAsync(person);

  let modifiedUser: IUser = {
    name: person.name.trim(),
    address: {
      city: person.address.city.trim(),
      state: person.address.state.trim(),
      postal_code: person.address.postal_code,
      country: person.address.country.trim(),
    },
    phone: Number(person.phone),
    gender: person.gender.trim(),
    email: person.email.trim(),
    dateOfBirth: person.dateOfBirth,
    hostEventArray: person.hostEventArray,
    cohostEventArray: person.cohostEventArray,
    attendEventArray: person.attendEventArray,
  };

  await users();
  let existingUser: IUser | null | undefined = await collections.users?.findOne({ email: modifiedUser.email });
  if (existingUser) {
    let updatedUser = await collections.users?.updateOne(
      { _id: existingUser._id },
      {
        $set: {
          name: modifiedUser.name,
          address: modifiedUser.address,
          phone: modifiedUser.phone,
          dateOfBirth: modifiedUser.dateOfBirth,
          hostEventArray: modifiedUser.hostEventArray,
          attendEventArray: modifiedUser.attendEventArray,
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
      return getUserById(existingUser._id?.toString()!);
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find user in database",
      status: 400,
    };
    throw err;
  }
}

async function deleteUser(id: string): Promise<{deleted: Boolean}> {
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
      status: 400,
    };
    throw err;
  }
}

async function addRegisteredEvents(id: string, eventId: string): Promise<IUser> {
  validityCheck(id, eventId);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if(user) {
    let registeredUser: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $addToSet: {
        attendEventArray: eventId
      }
    });
    if(registeredUser && registeredUser.modifiedCount == 1 ) {
      return getUserById(id);
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
      status: 400,
    };
    throw err;
  }
}

async function removeRegisteredEvents(id: string, eventId: string): Promise<IUser> {
  validityCheck(id, eventId);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if(user) {
    let unregisteredUser: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $pull: {
        attendEventArray: eventId
      }
    });
    if(unregisteredUser && unregisteredUser.modifiedCount == 1 ) {
      return getUserById(id);
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
      status: 400,
    };
    throw err;
  }  
}

async function addHostedEvents(id: string, eventId: string): Promise<IUser> {
  validityCheck(id, eventId);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if(user) {
    let registeredUser: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $addToSet: {
        hostEventArray: eventId
      }
    });
    if(registeredUser && registeredUser.modifiedCount == 1 ) {
      return getUserById(id);
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
      status: 400,
    };
    throw err;
  }
}

async function removeHostedEvents(id: string, eventId: string): Promise<IUser> {
  validityCheck(id, eventId);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if(user) {
    let removeHost: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $pull: {
        hostEventArray: eventId
      }
    });
    if(removeHost && removeHost.modifiedCount == 1 ) {
      return getUserById(id);
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
      status: 400,
    };
    throw err;
  }  
}

async function addCohostedEvents(id: string, eventId: string): Promise<IUser> {
  validityCheck(id, eventId);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if(user) {
    let registeredUser: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $addToSet: {
        cohostEventArray: eventId
      }
    });
    if(registeredUser && registeredUser.modifiedCount == 1 ) {
      return getUserById(id);
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
      status: 400,
    };
    throw err;
  }
}

async function removeCohostedEvents(id: string, eventId: string): Promise<IUser> {
  validityCheck(id, eventId);

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let user: WithoutId<IUser> | null | undefined = await collections.users?.findOne({
    _id: queryId
  });
  if(user) {
    let removeHost: UpdateResult | undefined = await collections.users?.updateOne({
      _id: queryId
    }, {
      $pull: {
        cohostEventArray: eventId
      }
    });
    if(removeHost && removeHost.modifiedCount == 1 ) {
      return getUserById(id);
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
      status: 400,
    };
    throw err;
  } 
}

async function getRegisteredEvents(id: string): Promise<{ events: IEvent[]; count: Number }> {
  if (!ObjectId.isValid(id)) {
    let err: ErrorWithStatus = {
      message: "Invalid User ID",
      status: 400,
    };
    throw err;
  }

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
  let eventArr: WithoutId<IEvent>[] | undefined = [];

  if (registeredDocs && registeredDocs.attendEventArray.length > 0) {
    let registeredEventIds: ObjectId[] = [];
    registeredDocs.hostEventArray.forEach((eId) => {
      let parsedId: ObjectId = new ObjectId(eId);
      registeredEventIds.push(parsedId);
    });
    eventArr = await collections.events
      ?.find(
        { _id: { $in: registeredEventIds } },
        {
          projection: { _id: 0 },
        }
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
  if (!ObjectId.isValid(id)) {
    let err: ErrorWithStatus = {
      message: "Invalid User ID",
      status: 400,
    };
    throw err;
  }

  let queryId: ObjectId = new ObjectId(id);
  await users();
  let hostDocs: WithoutId<IUser> | null | undefined = await collections.users?.findOne(
    { _id: queryId },
    {
      projection: {
        hostEventArray: 1,
      },
    }
  );

  console.log(hostDocs);
  let eventArr: WithoutId<IEvent>[] | undefined = [];

  if (hostDocs && hostDocs.hostEventArray.length > 0) {
    let hostedEventIds: ObjectId[] = [];
    hostDocs.hostEventArray.forEach((eId) => {
      let parsedId: ObjectId = new ObjectId(eId);
      hostedEventIds.push(parsedId);
    });
    eventArr = await collections.events
      ?.find(
        { _id: { $in: hostedEventIds } },
        {
          projection: { _id: 0 },
        }
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
  if (!ObjectId.isValid(id)) {
    let err: ErrorWithStatus = {
      message: "Invalid User ID",
      status: 400,
    };
    throw err;
  }

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
  let eventArr: WithoutId<IEvent>[] | undefined = [];

  if (cohostDocs && cohostDocs.cohostEventArray.length > 0) {
    let cohostedEventIds: ObjectId[] = [];
    cohostDocs.cohostEventArray.forEach((eId) => {
      let parsedId: ObjectId = new ObjectId(eId);
      cohostedEventIds.push(parsedId);
    });
    eventArr = await collections.events
      ?.find(
        { _id: { $in: cohostedEventIds } },
        {
          projection: { _id: 0 },
        }
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
