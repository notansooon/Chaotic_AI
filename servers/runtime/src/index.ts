import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import hypervisorRoutes from './routes/hypervisor';
import containersRoutes from './routes/containers';

const app = express();


app.use(morgan('dev'));
app.use(express.json());
app.use(cors())


app.use('/hypervisor', hypervisorRoutes);
app.use('/containers', containersRoutes);

const PORT = process.env.RUNTIME_PORT;