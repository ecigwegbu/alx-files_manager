// contains the definitions of /users endpoint
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
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
      if (!user) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
      }
    } catch (err) {
      res.status(500).send({ error: 'User Collection error' });
      return;
    }

    // check password
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
    // get authorisation header
    const sessionHeader = req.headers['x-token'];
    // console.log('req Header:', req.headers['X-Token']);

    // Decode and parse the Authorization header
    if (!sessionHeader) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    let userId;
    try {
      const userId = await redisClient.get(`auth_${sessionHeader.token}`);
      if (!userId) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
      }
    } catch (err) {
      res.status(500).send({ error: 'Redis Get Error' });
      return;
    }
    // now you have a valid userId and token!
    // delete key from Redis:

    try {
      await redisClient.del(`auth_${sessionHeader.token}`);
    } catch (err) {
      res.status(500).send({ error: 'Redis Del Error' });
      return;
    }
    // delete user from MongoDB
    try {
      await dbClient.db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    } catch (err) {
      res.status(500).send({ error: 'MongoDB Del Error' });
      return;
    }
    res.status(204).end();
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

const getMe = async (req, res) => {
  if (dbsAlive()) {
    // get authorisation header
    const sessionHeader = req.headers['x-token'];
    // console.log('req Header:', req.headers['X-Token']);

    // Check if header present
    if (!sessionHeader) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    // if token matches retrieve userId
    let userId;
    // console.log('-->--> sessionHeader', sessionHeader);
    // console.log('-->--> sessionHeader.token', sessionHeader.token);
    try {
      userId = await redisClient.get(`auth_${sessionHeader}`);
      // console.log('-->type of userid:', typeof userId);
      if (!userId) {
        res.status(401).send({ error: 'Unauthorized' });
        return;
      }
    } catch (err) {
      res.status(500).send({ error: 'Redis Get Error' });
      return;
    }
    // now you have a valid userId and token!
    // retrieve user from MongoDB
    // console.log('-->userId:', userId);
    // console.log(',,,,,,,Object id:',  new ObjectId(userId));
    let user;
    try {
      user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
    } catch (err) {
      res.status(500).send({ error: 'MongoDB Search Error' });
    }
    // console.log('-->user:', user);
    res.status(200).send({ id: userId, email: user.email });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

export { getConnect, getDisconnect, getMe };
