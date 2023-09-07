const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('../server');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

describe('GET /files/:id', () => {

  afterEach(() => {
    if (dbClient.getFile.restore) {
      dbClient.getFile.restore();
    }
    if (redisClient.getSession.restore) {
      redisClient.getSession.restore();
    }
  });

  it('should return file metadata with a 200 status', async () => {
    const mockFileData = { id: 'fileId', name: 'file.txt', userId: 'userId' };
    const mockUserId = 'userId';
    
    sinon.stub(dbClient, 'getFile').returns(Promise.resolve(mockFileData));
    sinon.stub(redisClient, 'getSession').returns(Promise.resolve({ userId: mockUserId }));

    const res = await chai.request(app)
      .get('/files/fileId')
      .set('Authorization', 'Bearer mockToken');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(mockFileData);
  });

  it('should return a 404 error if the file is not found', async () => {
    const mockUserId = 'userId';

    sinon.stub(dbClient, 'getFile').returns(Promise.resolve(null));
    sinon.stub(redisClient, 'getSession').returns(Promise.resolve({ userId: mockUserId }));
    
    const res = await chai.request(app)
      .get('/

