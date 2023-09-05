// contains definitions for the /files endpoint
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const fs = require('fs');
const util = require('util');
// import { ObjectId } from 'mongodb';
// import sha1 from 'sha1';

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
    // get file input from request
    const {
      name, type, isPublic = false, parentId = 0, data,
    } = req.body;
    // Input validation:
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }
    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return;
    }
    // Validate parentId
    if (parentId) {
      // console.log('ParentId:', parentId);
      // Lookup parentId in database
      let parentFile;
      try {
        parentFile = await dbClient.db.collection('files').findOne({ id: parentId });
        // console.log('ParentFile:', parentFile);
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
    if (type === 'folder') {
      // folder
      try {
        await dbClient.db.collection('files').insertOne({
          userId, name, type, isPublic, parentId,
        });
        // console.log('-->DB save folder:', dbInsertFolder);
      } catch (err) {
        console.log('Error: DB save error');
        throw err;
      }
      // save file to DB
      try {
        await dbClient.db.collection('files').insertOne({
          id: fileId, userId, name, type, isPublic, parentId,
        });
        // console.log('-->DB save file|image:', dbInsertFile);
      } catch (err) {
        console.log('Error: DB save error');
        throw err;
      }
    } else if (type === 'file' || type === 'image') {
      // Define the absolute folder path; assumes process.env.FOLDER_PATH is relative to cwd
      // const folderPath = process.env.FOLDER_PATH
      //   ? path.join(process.cwd(), process.env.FOLDER_PATH)
      //   : '/tmp/files_manager';
      let folderPath;
      if (process.env.FOLDER_PATH) {
        if (process.env.FOLDER_PATH.startsWith('/')) {
          // absolute folder given
          folderPath = process.env.FOLDER_PATH;
        } else {
          // join relative
          folderPath = path.join(process.cwd(), process.env.FOLDER_PATH);
        }
      } else {
        // use /tmp/files_manager
        folderPath = '/tmp/files_manager';
      }
      // establish localPath (absolute filename)
      // const fileId = `${uuidv4()}`;
      const localPath = path.join(folderPath, fileId); // absolute path of file
      // create the folder if it does not exist
      try {
        await fs.access(folderPath);
      } catch (err) {
        const mkdir = util.promisify(fs.mkdir);
        await mkdir(folderPath, { recursive: true });
      }
      // save the file to disk
      const buffer = Buffer.from(data, 'base64'); // converts to hex; will be plain text in file
      const writeFile = util.promisify(fs.writeFile);
      await writeFile(localPath, buffer);
      // save file to DB
      try {
        await dbClient.db.collection('files').insertOne({
          id: fileId, userId, name, type, isPublic, parentId, localPath,
        });
        // console.log('-->DB save file|image:', dbInsertFile);
      } catch (err) {
        console.log('Error: DB save error');
        throw err;
      }
    }
    // return file or folder
    res.status(201).send({
      id: fileId, userId, name, type, isPublic, parentId,
    });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

export default postUpload;
