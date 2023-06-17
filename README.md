# Allez
#### An Event Management System for users to register and host events

### Prerequisites
The project is split into 2 codebases - api and client. To run the project, clone the repo into your local, and run the following commands inside both the **api** and **client** folders:
> `npm i`

- Inside client folder:
> `npm run dev`

- Inside api folder:
> `npm start`

*The project also requires Redis to retrieve most recently visited events from cache. So, make sure to have Redis Client running before starting the application*

### Tools and Technologies Used:
| Tools | Usage |
| ----- | ----- |
| Stripe | Secure payment gateway for user to pay for paid events |
| Auth0 | Authenticates users and hosts and provides JWT for server authorization |
| Redis | Stores Event data in cache for quick access |
| Amazon S3 | Stores Event images and user profile pictures |
| Amazon Cloudfront | Hosts images presents in S3 buckets |
| MongoDB Atlas | Stores details on users and events such as payment links, description, location, price, and total no. of seats |

