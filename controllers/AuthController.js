// contains the definitions of /users endpoint
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const dbsAlive = () => (redisClient.isAlive() && dbClient.isAlive());

const getConnect = async (req, res) => {
  if (dbsAlive()) {
    // get authorisation header
    const authHeader = req.headers.authorization;

    // Decode and parse the Authorization header
    if (!authHeader) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const [email, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':');
    if (!email || !password) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    // check for existing user
    let user;
    try {
      user = await dbClient.db.collection('users').findOne({ email });
      console.log('-->-->', user);
      if (!user) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
      }
    } catch (err) {
      res.status(500).send({ error: 'User Collection error' });
      return;
    }

    // check password
    console.log('stored:', user.password);
    const storedHashedPassword = user.password;
    const testHashedPassword = sha1(`${password}`);
    if (storedHashedPassword !== testHashedPassword) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    // user logged in as user with email and password
    const token = uuidv4();
    const key = `auth_${token}`;
    try {
      await redisClient.set(key, user._id.toString(), 24 * 60 * 60);
    } catch (err) {
      res.status(500).send({ error: 'Redis Set Error' });
      return;
    }
    // res.status(200).send({ token: `${token}` });
    res.status(200).send({ token });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

const getDisconnect = async (req, res) => {
  if (dbsAlive()) {
    const { email, password } = req.body;
    // respond to client
    // res.status(201).send({ id: `${result.insertedId}`, email });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

const getMe = async (req, res) => {
  if (dbsAlive()) {
    const { email, password } = req.body;
    // respond to client
    // res.status(201).send({ id: `${result.insertedId}`, email });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

export { getConnect, getDisconnect, getMe };
/*
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
*/
