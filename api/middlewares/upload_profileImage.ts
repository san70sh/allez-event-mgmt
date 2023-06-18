// import { ServerApiVersion } from "mongodb";
import dotenv from "dotenv";
// import { GridFsStorage } from "multer-gridfs-storage";
import multer from "multer";
import multers3 from "multer-s3";
import {S3Client} from "@aws-sdk/client-s3";

dotenv.config()
// const credentials = './cert/X509-cert-7185957328460949904.pem'

// const storage = new GridFsStorage({
//     url: process.env.MONGO_URL!,

//     options: {
//         sslKey: credentials,
//         sslCert: credentials,
//         serverApi: ServerApiVersion.v1,
//     },

//     file: (req, file) => {
//             return {
//                 bucketName: "images",
//             }
//     }
// })

// const upload = multer({storage: storage})
const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS!,
        secretAccessKey: process.env.AWS_SECRET!
    },
    region: "us-east-2"
});

const s3Storage = multers3({
    s3: s3,
    bucket: "allez-user-images",
    key: function(req, file, callback) {
        callback(null, Date.now() + "_" + file.originalname)
    },
    contentType: multers3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
        if (file) {
            cb(null, {fieldName: file.fieldname})
        }
    }
});

const upload_profile = multer({
    storage: s3Storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
})

export default upload_profile