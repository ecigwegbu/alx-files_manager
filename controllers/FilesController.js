// contains definitions for the /files endpoint
// import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { ObjectId } from 'mongodb';
import Queue from 'bull';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const fs = require('fs').promises;
const util = require('util');
// import sha1 from 'sha1';

const dbsAlive = () => (redisClient.isAlive() && dbClient.isAlive());

// create a new file in DB and in disk
const postUpload = async (req, res) => { // update for task 9
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
        parentFile = await dbClient.db.collection('files').findOne({ _id: new ObjectId(parentId) });
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
    // Save file/image/folder to DB;
    let fileId; // file/image/folder id
    try {
      const result = await dbClient.db.collection('files').insertOne({
        userId: new ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: (parentId ? new ObjectId(parentId) : '0'), // localPath,
      });
      fileId = result.insertedId.toString();
      // console.log('-->fileId:', fileId);
    } catch (err) {
      console.log('Error: DB save error');
      // throw err;
    }
    // process file to disk
    if (type === 'file' || type === 'image') {
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
      // Update DB with localPath
      await dbClient.db.collection('files').updateOne({ _id: new ObjectId(fileId) }, { $set: { localPath } });

      // console.log('Update File Status:', updateStatus);
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
    }

    // update: start a background process for generating thumbnails for image file
    if (type === 'image') {
      // image file processing
      const fileQueue = new Queue('fileQueue', {
        redis: {
          host: '127.0.0.1',
          port: 6379,
        },
      });
      await fileQueue.add({ fileId, userId });
      // console.log('Processing image file...');
    }

    // return file or folder
    res.status(201).send({
      id: fileId, userId, name, type, isPublic, parentId,
    });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

const getShow = async (req, res) => {
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

    // process route
    // Lookup linkedFile in database
    const fileId = req.params.id;
    let linkedFile;
    try {
      // console.log('->fileId', fileId);
      linkedFile = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(fileId), userId: new ObjectId(userId),
      });
      // console.log('-->-->linkedFile._id', linkedFile);
      if (!linkedFile) {
        // No linked file
        res.status(404).json({ error: 'Not found' });
        return;
      }
    } catch (err) {
      // MDB Read error
      // throw err;
      res.status(500).json({ error: 'DB Read Error' });
      return;
    }
    // send file back to client
    res.status(200).send({
      id: linkedFile._id,
      userId: linkedFile.userId,
      name: linkedFile.name,
      type: linkedFile.type,
      isPublic: linkedFile.isPublic,
      parentId: linkedFile.parentId,
    });
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

// retrieve all users file documents for a specific parentId and with pagination
const getIndex = async (req, res) => {
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
    // get query parameters
    const { parentId = 0, page: rawPage } = req.query;
    // validate page:
    let page;
    if (rawPage) {
      const isDigits = /^\d+$/.test(rawPage);
      page = parseInt(rawPage, 10);
      if (!isDigits || !Number.isInteger(page)) {
        res.status(400).send({ error: 'Page must be an integer' });
        return;
      }
    } else {
      page = 0;
    }
    const pageSize = 20;
    // process route
    // Lookup linkedFiles in database for given userId, parentId and page
    let linkedFiles;
    try {
      const pipeline = [
        {
          $match: {
            userId: new ObjectId(userId),
            parentId: (parentId ? new ObjectId(parentId) : '0'),
          },
        },
        { $skip: page * pageSize },
        { $limit: pageSize },
      ];
      linkedFiles = await dbClient.db.collection('files').aggregate(pipeline).toArray();
      // console.log('--->B4: userId:', userId, 'parentId:', parentId);
      // console.log('linkedFile:', linkedFile);
      if (linkedFiles.length === 0) {
        // No linked file
        res.status(200).json([]);
        return;
      }
    } catch (err) {
      // MDB Read error
      res.status(500).json({ error: 'DB Read Error' });
      return;
    }
    // replace _id with id in each document in list
    const files = linkedFiles.map((obj) => {
      const { _id, localPath, ...rest } = obj;
      return { id: _id, ...rest };
    });
    // send file back to client
    res.status(200).send(files);
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

const putPublish = async (req, res) => {
  if (dbsAlive()) {
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

    // process route
    // Lookup linkedFile in database
    const fileId = req.params.id;
    let linkedFile;
    try {
      linkedFile = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(fileId), userId: new ObjectId(userId),
      });
      // console.log('---> type linkedFile:', typeof linkedFile, linkedFile);
      if (!linkedFile) {
        // No linked file
        res.status(404).json({ error: 'Not found' });
        return;
      }
    } catch (err) {
      // MDB Read error
      res.status(500).json({ error: 'DB Read Error' });
      return;
    }
    // publish file
    await dbClient.db.collection('files').updateOne(
      { _id: linkedFile._id },
      { $set: { isPublic: true } },
    );
    // get public version of linkedFile:

    const {
      _id, localPath, isPublic, ...rest
    } = linkedFile;
    const newObj = { id: _id, isPublic: true, ...rest };
    // send file back to client
    res.status(200).send(newObj);
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

const putUnpublish = async (req, res) => {
  if (dbsAlive()) {
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

    // process route
    // Lookup linkedFile in database
    const fileId = req.params.id;
    let linkedFile;
    try {
      linkedFile = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(fileId), userId: new ObjectId(userId),
      });
      // console.log('---> type linkedFile:', typeof linkedFile, linkedFile);
      if (!linkedFile) {
        // No linked file
        res.status(404).json({ error: 'Not found' });
        return;
      }
    } catch (err) {
      // MDB Read error
      res.status(500).json({ error: 'DB Read Error' });
      return;
    }
    // publish file
    await dbClient.db.collection('files').updateOne(
      { _id: linkedFile._id },
      { $set: { isPublic: true } },
    );
    // get public version of linkedFile:

    const {
      _id, localPath, isPublic, ...rest
    } = linkedFile;
    const newObj = {
      id: _id, isPublic: false, ...rest,
    };
    // send unpublished file back to client
    res.status(200).send(newObj);
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

const getFile = async (req, res) => {
  if (dbsAlive()) {
    let authStatus = 0;
    let userId;
    const sessionHeader = req.headers['x-token'];
    // Check if header present
    if (sessionHeader) {
      // if token matches retrieve userId
      try {
        userId = await redisClient.get(`auth_${sessionHeader}`);
        if (userId) {
          authStatus = 1; // authenticated
        }
      } catch (err) {
        authStatus = 0;
      }
    }

    // process route
    // Lookup linkedFile in database
    const fileId = req.params.id;
    let linkedFile;
    try {
      linkedFile = await dbClient.db.collection('files').findOne({
        _id: new ObjectId(fileId),
      });
      // console.log('---> type linkedFile:', typeof linkedFile, linkedFile);
      if (!linkedFile) {
        // No linked file
        res.status(404).json({ error: 'Not found' });
        return;
      }
    } catch (err) {
      // MDB Read error
      res.status(500).json({ error: 'DB Read Error' });
      return;
    }

    // process file:
    if (
      linkedFile.isPublic === false && (
        // no user authenticates or not the rightful owner
        authStatus === 0 || linkedFile.userId.toString() !== userId
      )
    ) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (linkedFile.type === 'folder') {
      // folder does not have content
      res.status(400).send({ error: "A folder doesn't have content" });
      return;
    }
    if (!linkedFile.localPath) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    // get the mime type:
    // console.log('--->>> File Name:', linkedFile.name);
    // console.log('--->>> File localPath:', linkedFile.localPath);
    const mimeType = mime.lookup(linkedFile.name);
    // console.log('--->>> mime type:', mimeType);
    if (mimeType) {
      // Read the file into memory
      // console.log('--->>> File localPath:', linkedFile.localPath);
      const data = await fs.readFile(linkedFile.localPath);

      // Set the Content-Type and send the file
      res.setHeader('Content-Type', mimeType);
      res.status(200).send(data);
    } else {
      res.status(400).send('Invalid MIME type');
    }
  } else {
    res.status(500).send({ error: 'Database not alive' });
  }
};

export {
  postUpload, getShow, getIndex, putPublish, putUnpublish, getFile,
};
