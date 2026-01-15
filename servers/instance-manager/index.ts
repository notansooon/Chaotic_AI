import express from "express";
import dotenv from "dotenv";
import { runsRouter } from "./runs";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/runs", runsRouter);

const PORT = Number(process.env.INSTANCE_MANAGER_PORT) || 3001;

app.listen(PORT, () => {
    console.log(`Instance Manager listening on ${PORT}`);
});


