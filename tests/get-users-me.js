const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
chai.use(chaiHttp);

const app = require('./server');
const dbClient = require('./utils/dbClient');

describe('GET /users/me', () => {

  afterEach(() => {
    if (dbClient.getUserById.restore) {
      dbClient.getUserById.restore();
    }
  });

  it('should return the user data for a valid userId', async () => {
    const mockUser = { id: '123', name: 'John Doe', email: 'john@example.com' };
    sinon.stub(dbClient, 'getUserById').returns(Promise.resolve(mockUser));

    const res = await chai.request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer mockToken');

    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal(mockUser);
  });

  it('should return a 404 error if the user is not found', async () => {
    sinon.stub(dbClient, 'getUserById').returns(Promise.resolve(null));

    const res = await chai.request(app)
      .get('/users/me')
      .set('Authorization', 'Bearer mockToken');

    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal('User not found');
  });
});


