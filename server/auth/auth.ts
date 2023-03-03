import express from "express";
import { expressjwt, GetVerificationKey } from "express-jwt";
import jwksRsa from "jwks-rsa"

export const checkJwt = expressjwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://dev-q8b8kekg4eux83ok.us.auth0.com/.well-known/jwks.json`
    }) as GetVerificationKey,
    audience: "localhost:5173/api",
    issuer: 'https://dev-q8b8kekg4eux83ok.us.auth0.com/',
    algorithms: ['RS256']
})

export const extractData = (req: express.Request, res: express.Response, next: express.NextFunction) => {
}