const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('./app');
const redisClient = require('./utils/redis');
const dbClient = require('./utils/db');

describe('GET /status', () => {
  it('should return the status of Redis and DB', async () => {
    sinon.stub(redisClient, 'isAlive').returns(true);
    sinon.stub(dbClient, 'isAlive').returns(true);

    const res = await chai.request(app).get('/status');
    
    expect(res.body).to.deep.equal({ redis: true, db: true });

    redisClient.isAlive.restore();
    dbClient.isAlive.restore();
  });
});

describe('GET /stats', () => {
  it('should return the statistics', async () => {
    sinon.stub(dbClient, 'nbUsers').returns(10);
    sinon.stub(dbClient, 'nbFiles').returns(5);

    const res = await chai.request(app).get('/stats');
    
    expect(res.body).to.deep.equal({ users: 10, files: 5 });

    dbClient.nbUsers.restore();
    dbClient.nbFiles.restore();
  });
});
