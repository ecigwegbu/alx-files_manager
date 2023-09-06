// contains definitions for the /files endpoint
// import { v4 as uuidv4 } from 'uuid';
// import path from 'path';
import { ObjectId } from 'mongodb';
import Queue from 'bull';
import thumbnail from 'image-thumbnail';
// import redisClient from './utils/redis';
import dbClient from './utils/db';

const fs = require('fs').promises;

// create queue
const fileQueue = new Queue('fileQueue', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
});
// process queue
fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId });

  if (!file) throw new Error('File not found');

  const widths = [500, 250, 100];

  // for (const width of widths) {
  //  const thumbnailBuffer = await thumbnail({ uri: file.localPath }, { width });
  //  const thumbnailPath = `${file.localPath}_${width}`;
  //  await fs.writeFile(thumbnailPath, thumbnailBuffer);
  // }
  const thumbnailPromises = widths.map(async (width) => {
    const thumbnailBuffer = await thumbnail({ uri: file.path }, { width });
    const thumbnailPath = `${file.localPath}_${width}`;
    return fs.writeFile(thumbnailPath, thumbnailBuffer);
  });
  await Promise.all(thumbnailPromises);
});
