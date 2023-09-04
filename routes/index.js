// contains all endpoints
import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import postNew from '../controllers/UsersController';

const routes = express.Router();

routes.get('/status', getStatus);
routes.get('/stats', getStats);
routes.post('/users', postNew);

module.exports = routes;
