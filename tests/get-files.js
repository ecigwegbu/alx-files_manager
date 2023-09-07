const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('../server');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

describe('GET /files', () => {

  afterEach(() => {
    if (dbClient.getFiles.restore) {
      dbClient.getFiles.restore();
    }
    if (redisClient.getSession.restore) {
      redisClient.getSession.restore();
    }
  });

  it('should return paginated file metadata with a 200 status', async () => {
    const mockFiles = [
      { id: 'file1', name: 'file1.txt', userId: 'userId' },
      { id: 'file2', name: 'file2.txt', userId: 'userId' },
      // ...more files
    ];
    const mockUserId = 'userId';

    sinon.stub(dbClient, 'getFiles').returns(Promise.resolve(mockFiles));
    sinon.stub(redisClient, 'getSession').returns(Promise.resolve({ userId: mockUserId }));

    const res = await chai.request(app)
      .get('/files?page=1&limit=10')
      .set('Authorization', 'Bearer mockToken');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(mockFiles);
  });

});
