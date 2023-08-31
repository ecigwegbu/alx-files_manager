// Redis Class
import redis from 'redis';

export default class RedisClient {
  // creates a client to Redis and handles errors
  constructor() {
    ..
  }

  function isAlive() {
    // Returns true when connection is successful
    ..
  }

  async function get(key) {
    // gets a redis key
  }

  async function set(key, value, duration) {
    // set key-value with expiration
  }

  async function del(key) {
    // removes a key in Redis
  }

  redisClient = redisClient();
}
