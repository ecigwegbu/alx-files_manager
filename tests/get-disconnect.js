const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('./server');
const redisClient = require('./utils/redis');

describe('GET /disconnect', () => {

  afterEach(() => {
    if (redisClient.disconnect.restore) {
      redisClient.disconnect.restore();
    }
  });

  it('should disconnect from Redis and return a success message', async () => {
    sinon.stub(redisClient, 'disconnect').returns(Promise.resolve());

    const res = await chai.request(app)
      .get('/disconnect');

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Successfully disconnected from Redis');
  });

  it('should return a 500 error for Redis disconnection failures', async () => {
    sinon.stub(redisClient, 'disconnect').throws(new Error('Redis disconnection error'));

    const res = await chai.request(app)
      .get('/disconnect');

    expect(res.status).to.equal(500);
    expect(res.body.error).to.equal('Failed to disconnect from Redis');
  });
});

