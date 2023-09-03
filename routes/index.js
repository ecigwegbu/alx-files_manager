// contains all endpoints
import express from 'express';
import { statusRoute, statsRoute } from '../controllers/AppController';

const routes = express.Router();

routes.get('/status', statusRoute);
routes.get('/stats', statsRoute);

module.exports = routes;
