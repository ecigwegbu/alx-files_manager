// contains all endpoints
import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import postNew from '../controllers/UsersController';
import { getConnect, getDisconnect, getMe } from '../controllers/AuthController';

const routes = express.Router();

routes.get('/status', getStatus);
routes.get('/stats', getStats);
routes.post('/users', postNew);
routes.get('/connect', getConnect);
routes.get('/disconnect', getDisconnect);
routes.get('/users/me', getMe);

module.exports = routes;
