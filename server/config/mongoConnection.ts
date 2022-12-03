import {MongoClient, ServerApiVersion} from "mongodb"

const credentials = './cert/X509-cert-7185957328460949904.pem'
const client = new MongoClient('mongodb+srv://allez0.jt2qrli.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority', {
  sslKey: credentials,
  sslCert: credentials,
  serverApi: ServerApiVersion.v1
});

  async function run() {
    try {
        await client.connect();
        const database = client.db("allez");
        return database;
    } catch (e: any) {
        console.log(e);
    }
  }

  export default run;