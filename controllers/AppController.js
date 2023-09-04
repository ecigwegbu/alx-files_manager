// contains the definitions of all endpoints
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const dbsAlive = () => (redisClient.isAlive() && dbClient.isAlive());

const getStatus = (req, res) => {
  if (dbsAlive()) {
    res.status(200).send({ redis: true, db: true });
  } else {
    res.status(500).send({ Error: 'Database not alive' });
  }
};

const getStats = async (req, res) => {
  if (dbsAlive()) {
    const nbUsers = await dbClient.nbUsers();
    const nbFiles = await dbClient.nbFiles();
    res.status(200).send({ users: nbUsers, files: nbFiles });
  } else {
    res.status(500).send({ Error: 'Database not alive' });
  }
};

export { getStatus, getStats };
