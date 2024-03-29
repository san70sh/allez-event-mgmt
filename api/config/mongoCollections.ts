import dbConnection from "./mongoConnection.js";
import IUser from "../models/users.model";
import {Collection, GridFSBucket} from "mongodb";
import IEvent from "../models/events.model";


export const collections: {
    users?: Collection<IUser>,
    events?: Collection<IEvent>,
} = {}

export async function users() {
    let _col: Collection | undefined;
    if (!_col) {
        const db = await dbConnection();
        if(db) {
            const usersCol = db.collection<IUser>("Users");
            collections.users = usersCol;
        }
    };
};


export async function events() {
    let _col: Collection | undefined;
    if (!_col) {
        const db = await dbConnection();
        if(db) {
            const eventsCol = db.collection<IEvent>("Events");
            collections.events = eventsCol;
        }
    };
};

export async function images() {
    const db = await dbConnection();
    if(db) {
        const collection = new GridFSBucket(db, {
            bucketName: "images"
        })
        return collection
    }
}