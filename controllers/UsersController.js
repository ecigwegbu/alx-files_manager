// contains the definitions of /users endpoint
import crypto from 'crypto';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const dbsAlive = () => (redisClient.isAlive() && dbClient.isAlive());

const usersRoute = async (req, res) => {
  if (dbsAlive()) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).send({ error: 'Missing email' });
    } else if (!password) {
      res.status(400).send({ error: 'Missing password' });
    }

    try {
      await dbClient.users.findOne({ email });
      res.status(400).send({ error: 'Already exist' });
    } catch (err) {
      // hash password
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      // add user to db
      const result = await dbClient.db.collection('users').insertOne(
        { email, password: hashedPassword },
      );
      // respond to client
      res.status(200).send({ id: `${result.insertedId}`, email });
    }
  } else {
    res.status(500).send({ Error: 'Database not alive' });
  }
};

export default usersRoute;
