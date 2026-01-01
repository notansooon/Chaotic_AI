import express from "express";
import dotenv from "dotenv";
import { runsRouter } from "./runs";



const app = express();
app.use("/runs", runsRouter);

const PORT = Number(process.env.INSTANCE_MANAGER)

app.listen(PORT, () =>{
    console.log(`Instance Manager listening on ${PORT}`)
})


