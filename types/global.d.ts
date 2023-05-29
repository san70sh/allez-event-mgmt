export class ErrorWithStatus {
    status: number;
    message: string;
}

declare module "express-session" {
    interface SessionData {
        userId: string | undefined
    }
}