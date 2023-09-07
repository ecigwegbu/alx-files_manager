const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('../server');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

describe('POST /files', () => {

  afterEach(() => {
    if (dbClient.saveFile.restore) {
      dbClient.saveFile.restore();
    }
    if (redisClient.getSession.restore) {
      redisClient.getSession.restore();
    }
  });

  it('should successfully upload a file and return a 201 status', async () => {
    const mockFileData = { id: 'fileId', name: 'file.txt' };
    const mockUserId = 'userId';
    
    sinon.stub(dbClient, 'saveFile').returns(Promise.resolve(mockFileData));
    sinon.stub(redisClient, 'getSession').returns(Promise.resolve({ userId: mockUserId }));
    
    const res = await chai.request(app)
      .post('/files')
      .set('Authorization', 'Bearer mockToken')
      .attach('file', 'tests/assets/test.txt');
      
    expect(res.status).to.equal(201);
    expect(res.body).to.deep.equal(mockFileData);
  });

  it('should return a 400 error if file is not provided', async () => {
    const res = await chai.request(app)
      .post('/files')
      .set('Authorization', 'Bearer mockToken');
      
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('No file uploaded');
  });

});


