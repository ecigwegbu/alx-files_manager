const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('../server');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

describe('PUT /files/:id', () => {

  afterEach(() => {
    if (dbClient.updateFile.restore) {
      dbClient.updateFile.restore();
    }
    if (redisClient.getSession.restore) {
      redisClient.getSession.restore();
    }
  });

  it('should update file metadata and return 200 status', async () => {
    const mockFileId = 'fileId';
    const mockUserId = 'userId';
    const mockFile = { id: mockFileId, name: 'file.txt', userId: mockUserId };
    const updatedFile = { ...mockFile, name: 'newFile.txt' };

    sinon.stub(dbClient, 'updateFile').returns(Promise.resolve(updatedFile));
    sinon.stub(redisClient, 'getSession').returns(Promise.resolve({ userId: mockUserId }));

    const res = await chai.request(app)
      .put(`/files/${mockFileId}`)
      .set('Authorization', 'Bearer mockToken')
      .send({ name: 'newFile.txt' });

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(updatedFile);
  });
});

