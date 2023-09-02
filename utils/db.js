

class DBClient {
  // create a client MongoDB
  constructor() {
    //
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.port = process.env.DB_DATABASE || 'files_manager';
  }

  isAlive() {
    // return if the database is alive or not (bool)
  }

  async nbUsers() {
    // return the number of documents in the collection users
  }
  
  async nbFiles() {
    // return number of documents in the collection files
  }
}

const dbClient = DBClient();
export default dbClient;
