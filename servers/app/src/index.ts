import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import auth from './libs/auth';
import { toNodeHandler } from 'better-auth/node';
import { fromNodeHeaders } from 'better-auth/node';

dotenv.config();


const app = express();


app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));


app.all('/api/auth/*splat', toNodeHandler(auth));

//session endpoint
app.get("/api/me", async (req, res) => {
 	const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
	return res.json(session);
});




/* Configuration */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan('combined'));
app.use(express.json());

/* Routes */
app.get('/', (req, res) => {
    console.log('Root / called');
    res.send('Welcome to the OptimizeMe Server!');

})





import exploreRoutes from './routes/projectRoutes';

app.use('/explore', exploreRoutes);





const port = process.env.PORT || 9000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})