// contains the definitions of /users endpoint
import sha1 from 'sha1';
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
      res.status(500).send({ error: 'User Collection error' });
      return;
    }
    // hash password
    // const salt = 'GYt59Hvfgwq+tPut6-iuytrdseboy';
    // const hashedPassword = sha1(`${password}${salt}`);
    const hashedPassword = sha1(`${password}`);
    // add user to db
    const result = await dbClient.db.collection('users').insertOne(
      { email, password: hashedPassword },
    );
    // respond to client
    res.status(201).send({ id: `${result.insertedId}`, email });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

export default postNew;
