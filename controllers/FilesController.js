// contains definitions for the /files endpoint
import { v4 as uuidv4 } from 'uuid';
// import { ObjectId } from 'mongodb';
// import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const dbsAlive = () => (redisClient.isAlive() && dbClient.isAlive());

const postUpload = async (req, res) => {
  if (dbsAlive()) {
    // get session (x-token) header
    const sessionHeader = req.headers['x-token'];

    // Check if header present
    if (!sessionHeader) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }
    // if token matches retrieve userId
    let userId;
    try {
      userId = await redisClient.get(`auth_${sessionHeader}`);
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

    // get file input
    const {
      name, type, isPublic = false, parentId = 0, data,
    } = req.body;
    // Input validation:
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }
    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return;
    }
    // Validate parentId
    if (parentId) {
      // Lookup parentId in database
      let parentFile;
      try {
        parentFile = await dbClient.db.collection('files').findOne({ parentId });
        if (!parentFile) {
          // Parent Not Found
          res.status(400).json({ error: 'Parent not found' });
          return;
        }
      } catch (err) {
        // MDB Read error
        res.status(500).json({ error: 'DB Read Error' });
        return;
      }
      // Handle case of pid available
      if (parentFile.type !== 'folder') {
        // Invalid parent type
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const fileId = uuidv4();
    res.status(200).send({
      id: fileId, userId, name, type, isPublic, parentId,
    });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

export default postUpload;
