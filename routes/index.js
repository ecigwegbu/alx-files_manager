// contains all endpoints
import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import postNew from '../controllers/UsersController';
import { getConnect, getDisconnect, getMe } from '../controllers/AuthController';
import { postUpload, getShow, getIndex } from '../controllers/FilesController';

const routes = express.Router();

routes.get('/status', getStatus);
routes.get('/stats', getStats);
routes.post('/users', postNew);
routes.get('/connect', getConnect);
routes.get('/disconnect', getDisconnect);
routes.get('/users/me', getMe);
routes.post('/files', postUpload);
routes.get('/files/:id', getShow);
routes.get('/files', getIndex);


module.exports = routes;
