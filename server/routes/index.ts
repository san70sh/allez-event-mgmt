import userRoutes from "./userRoutes";
import eventRoutes from "./eventRoutes"

const allRoutes = (app: { use: (req: string, res: any) => void; }) => {
    console.log("inside routes index file");
    app.use("/users", userRoutes);
    app.use("/events", eventRoutes)
}

export default allRoutes;