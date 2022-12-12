import userRoutes from "./userRoutes";
import eventRoutes from "./eventRoutes"

const allRoutes = (app: { use: (req: string, res: any) => void; }) => {
    console.log("inside routes index file");
    app.use("/signup", userRoutes);
    app.use("/events", eventRoutes);
    app.use("/new", eventRoutes);
    app.use("/users", userRoutes);
}

export default allRoutes;