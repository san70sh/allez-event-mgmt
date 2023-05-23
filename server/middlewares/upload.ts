import { ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
import { GridFsStorage } from "multer-gridfs-storage";
import multer from "multer";

dotenv.config()
const credentials = './cert/X509-cert-7185957328460949904.pem'

const storage = new GridFsStorage({
    url: process.env.MONGO_URL!,

    options: {
        sslKey: credentials,
        sslCert: credentials,
        serverApi: ServerApiVersion.v1,
    },

    file: (req, file) => {
        return {
            bucketName: "images",
        }
    }
})

const upload = multer({ storage: storage })

export default upload