const server = require('../api/server');
// eslint-disable-next-line import/order
const request = require('supertest')(server);
const db = require('../data/dbConfig');
const mockUsers = require('../data/mock/auth.mock');

const baseUrl = '/api';

beforeEach(async () => {
  await db.raw('TRUNCATE TABLE event_categories,events, users CASCADE');
});

describe('api/auth/* endpoints', () => {
  describe('Register [POST] /api/auth', () => {
    test('should signup user and return 201 Created', async () => {
      const res = await request
        .post(`${baseUrl}/auth/register`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.validInput1);
      expect(res.status).toBe(201);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toEqual(true);
      expect(res.body.token);
    });

    test('should throw an error if any field is empty', async () => {
      const res = await request
        .post(`${baseUrl}/auth/register`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.emptyData);
      expect(res.statusCode).toBe(400);
      expect(res.body.check).toEqual({
        email: 'email field can not be blank',
        password: 'password field can not be blank'
      });
    });

    test('should throw an error if the email has already been used by another user', async () => {
      await request
        .post(`${baseUrl}/auth/register`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.validInput1);

      const res = await request
        .post(`${baseUrl}/auth/register`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.existingEmail);
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toEqual(false);
      expect(res.body.message).toEqual(
        'User with email banner@yahoo.com already exist'
      );
    });

    test('should throw an error if any field is invalid', async () => {
      const res = await request
        .post(`${baseUrl}/auth/register`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.improperData);
      expect(res.statusCode).toBe(400);
      expect(res.body.check).toEqual({
        email: 'Invalid email',
        password: 'password must between 8 and 50 characters'
      });
    });
  });

  describe('LOGIN [POST] /api/auth', () => {
    test('should return 200 OK', async () => {
      await request
        .post(`${baseUrl}/auth/register`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.validInput1);

      const res = await request
        .post(`${baseUrl}/auth/login`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.userOneLogin);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toEqual(true);
      expect(res.body.token);
    });

    test('should throw an error when email field is empty', async () => {
      const res = await request
        .post(`${baseUrl}/auth/login`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.noEmail);
      expect(res.statusCode).toBe(400);
      expect(res.body.check).toEqual({
        email: 'email field can not be blank'
      });
    });

    test('should throw an error when password is empty', async () => {
      const res = await request
        .post(`${baseUrl}/auth/login`)
        .set('Content-Type', 'application/json')
        .send(mockUsers.noPassword);
      expect(res.statusCode).toBe(400);
      expect(res.body.check).toEqual({
        password: 'password field can not be blank'
      });
    });

    test('should not let unregistered users login', async () => {
      const res = await request
        .post(`${baseUrl}/auth/login`)
        .set('Content-Type', 'application/json')
        .send({ ...mockUsers.unregisteredEmail, ...mockUsers.newPassword });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toEqual('wrong credentials');
    });
  });
});
