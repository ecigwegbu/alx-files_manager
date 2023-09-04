// contains all endpoints
import express from 'express';
import { statusRoute, statsRoute } from '../controllers/AppController';
import usersRoute from '../controllers/UsersController';

const routes = express.Router();

routes.get('/status', statusRoute);
routes.get('/stats', statsRoute);
routes.post('/users', usersRoute);

module.exports = routes;
