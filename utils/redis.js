// Redis Class
import redis from 'redis';
import { promisify } from 'util';
import assert from 'assert';

export default class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connectionPromise = new Promise((resolve, reject) => {
      this.client.on('error', (err) => {
        console.log('Redis client not connected to the server:', err.message);
        reject(err);
      });
      this.client.on('ready', () => {
        console.log('Redis client connected to the server');
        resolve();
      });
    });
  }

  async isAlive() {
    await this.connectionPromise;
    return this.client.connected;
  }

  async get(key) {
    // await this.connectionPromise;
    const asyncGet = promisify(this.client.get).bind(this.client);
    await asyncGet(key);
  }

  async set(key, value, duration) {
    // await this.connectionPromise;
    const asyncSet = promisify(this.client.set).bind(this.client);
    await asyncSet(key, value, 'EX', duration);
  }

  async del(key) {
    // await this.connectionPromise;
    const asyncDel = promisify(this.client.del).bind(this.client);
    await asyncDel(key);
  }
}

const run = async () => {
  const client = new RedisClient();
  try {
    assert(await client.isAlive());
    const setStat = await client.set('name', 'Jim', 10);
    console.log('Name  set:', setStat);
    let name = await client.get('name');
    console.log('Get Name:', name);
    const delStat = await client.del('name');
    console.log('Deleted:', delStat);
    name = await client.get('name');
    console.log('Get Name After Delete:', name);
  } catch (err) {
    console.log('Error:', err.message);
  }
};

run();
