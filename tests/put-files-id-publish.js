const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('../server');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

describe('PUT /files/:id/publish', () => {

  afterEach(() => {
    if (dbClient.db.collection.restore) {
      dbClient.db.collection.restore();
    }
    if (redisClient.getSession.restore) {
      redisClient.getSession.restore();
    }
  });

  it('should publish a file and return 200 status', async () => {
    const mockFileId = 'fileId';
    const mockUserId = 'userId';

    const mockCollection = {
      updateOne: sinon.stub().returns(Promise.resolve({ modifiedCount: 1 }))
    };

    sinon.stub(dbClient.db, 'collection').returns(mockCollection);
    sinon.stub(redisClient, 'getSession').returns(Promise.resolve({ userId: mockUserId }));

    const res = await chai.request(app)
      .put(`/files/${mockFileId}/publish`)
      .set('Authorization', 'Bearer mockToken');

    expect(res.status).to.equal(200);
    expect(mockCollection.updateOne.calledWith({ _id: mockFileId, userId: mockUserId }, { $set: { isPublic: true } })).to.be.true;
  });
});

