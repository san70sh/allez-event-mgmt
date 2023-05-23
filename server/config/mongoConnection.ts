import {Db, MongoClient, ServerApiVersion} from "mongodb"

const credentials = './cert/X509-cert-7185957328460949904.pem'
const client = new MongoClient('mongodb+srv://allez0.jt2qrli.mongodb.net/allez?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority', {
  sslKey: credentials,
  sslCert: credentials,
  serverApi: ServerApiVersion.v1,
});

let db: Db;

async function run() {
  try {
    if(db) {
      return db;
    }
    await client.connect();
    db = client.db(process.env.MONGO_DBNAME);
    return db;
  } catch (e: any) {
      console.log(e);
  }
}

  export default run;