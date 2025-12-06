import express from "express";
import dotenv from "dotenv";
import { runsRouter } from "./runs";
import { runRouter } from "../agents/routers/run";


const app = express();
app.use("/", runRouter);

const PORT = Number(process.env.INSTANCE_MANAGER)

app.listen(PORT, () =>{
    console.log(`Instance Manager listening on ${PORT}`)
})


