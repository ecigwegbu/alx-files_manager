// Redis Class
import redis from 'redis';
import { promisify } from 'util';
// import assert from 'assert';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.connected = true;
    this.client.on('error', (err) => {
      console.log('Redis client not connected to the server:', err.message);
    });
    this.client.on('ready', () => {
      // console.log('Redis client connected to the server');
    });
  }

  isAlive() {
    // await this.connectionPromise;
    return this.client.connected;
  }

  async get(key) {
    const asyncGet = promisify(this.client.get).bind(this.client);
    const value = await asyncGet(key);
    return value;
  }

  async set(key, value, duration) {
    const asyncSet = promisify(this.client.set).bind(this.client);
    await asyncSet(key, value, 'EX', duration);
  }

  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    const deletionCount = await asyncDel(key);
    return deletionCount;
  }
}

const redisClient = new RedisClient();
export default redisClient;
// export default new RedisClient();
