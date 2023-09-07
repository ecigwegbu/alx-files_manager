const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('./app'); 
const redisClient = require('./utils/redis');

describe('GET /connect', () => {

  afterEach(() => {
    if (redisClient.connect.restore) {
      redisClient.connect.restore();
    }
  });

  it('should connect to Redis and return a success message', async () => {
    sinon.stub(redisClient, 'connect').returns(Promise.resolve());

    const res = await chai.request(app)
      .get('/connect');

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Successfully connected to Redis');
  });

  it('should return a 500 error for Redis connection failures', async () => {
    sinon.stub(redisClient, 'connect').throws(new Error('Redis connection error'));

    const res = await chai.request(app)
      .get('/connect');

    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Failed to connect to Redis');
  });
});

