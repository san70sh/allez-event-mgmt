import userRoutes from "./userRoutes.js";
import eventRoutes from "./eventRoutes.js"

const allRoutes = (app: { use: (req: string, res: any) => void; }) => {
    console.log("inside routes index file");
    app.use("/events", eventRoutes);
    app.use("/users", userRoutes);
}

export default allRoutes;