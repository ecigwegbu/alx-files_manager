const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;

const app = require('../server');
const dbClient = require('../utils/db');

chai.use(chaiHttp);

describe('POST /users', () => {

  afterEach(() => {
    if (dbClient.db.collection.restore) {
      dbClient.db.collection.restore();
    }
  });

  it('should create a new user and return a 201 status', async () => {
    const mockUser = {
      email: 'test@test.com',
      password: 'password123'
    };

    const mockCollection = {
      insertOne: sinon.stub().returns(Promise.resolve({ ops: [mockUser] }))
    };

    sinon.stub(dbClient.db, 'collection').returns(mockCollection);

    const res = await chai.request(app)
      .post('/users')
      .send(mockUser);

    expect(res.status).to.equal(201);
    expect(res.body.email).to.equal(mockUser.email);
    expect(mockCollection.insertOne.calledOnceWith(mockUser)).to.be.true;
  });
  
  it('should return a 400 status for missing parameters', async () => {
    const res = await chai.request(app)
      .post('/users')
      .send({ email: 'test@test.com' });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('Missing parameters');
  });
});

