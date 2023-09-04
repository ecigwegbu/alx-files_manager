// contains the definitions of /users endpoint
import crypto from 'crypto';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const dbsAlive = () => (redisClient.isAlive() && dbClient.isAlive());

const postNew = async (req, res) => {
  if (dbsAlive()) {
    const { email, password } = req.body;
    // check if email or password missing
    if (!email) {
      res.status(400).send({ error: 'Missing email' });
      res.end();
      return;
    }
    if (!password) {
      res.status(400).send({ error: 'Missing password' });
      return;
    }
    // check for existing user
    try {
      const user = await dbClient.db.collection('users').findOne({ email });
      if (user) {
        res.status(400).send({ error: 'Already exist' });
        return;
      }
    } catch (err) {
      res.status(500).send({ Error: 'User Collection Error' });
      return;
    }
    // hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.createHash('sha1', salt).update(password).digest('hex');
    // add user to db
    const result = await dbClient.db.collection('users').insertOne(
      { email, password: hashedPassword },
    );
    // respond to client
    res.status(200).send({ id: `${result.insertedId}`, email });
  } else {
    res.status(500).send({ Error: 'Database not alive' });
  }
};

export default postNew;
