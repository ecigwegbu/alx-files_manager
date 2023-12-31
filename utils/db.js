// Connect to a MongoDB database
import { MongoClient } from 'mongodb';

class DBClient {
  // create a client MongoDB
  constructor() {
    //
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.dbName = process.env.DB_DATABASE || 'files_manager';

    // this.url = `mongodb:\/\/${this.host}:${this.port}`;
    this.url = `mongodb://${this.host}:${this.port}`;
    this.isConnected = false;
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });
    (async () => {
      try {
        await this.client.connect();
        this.isConnected = true;
        this.db = this.client.db(this.dbName);
      } catch (err) {
        console.log('Connection failed', err);
      }
    })();
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    // return the number of documents in the collection users
    const nb = await this.db.collection('users').countDocuments();
    return nb;
  }

  async nbFiles() {
    // return number of documents in the collection files
    const nb = await this.db.collection('files').countDocuments();
    return nb;
  }
}

const dbClient = new DBClient();
export default dbClient;
