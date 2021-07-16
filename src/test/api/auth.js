const expect = require("chai").expect;
const request = require("supertest");
const app = require("../../index");
const { connectDB, closeDB } = require("../../configs/mongo");

const mockUser = {
  username: "testsuser",
  email: "testemail@gmail.com",
  password: "testpassword",
};

describe("Authentication Routes tests", () => {
  before((done) => {
    connectDB()
      .then(() => done())
      .catch((err) => done(err));
  });

  after((done) => {
    closeDB()
      .then(() => done())
      .catch((err) => done(err));
  });

  it("OK, Register a user with valid inputs", (done) => {
    request(app)
      .post("/auth/register")
      .send(mockUser)
      .end((err, res) => {
        expect(res.statusCode).to.equal(201);
        done();
      });
  });

  it("FAIL, Register a user with invaid inputs", (done) => {
    request(app)
      .post("/auth/register")
      .send({
        username: "test1234",
        email: "invalidemail",
        password: "somepassword",
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it("FAIL, Register a user with missing inputs", (done) => {
    request(app)
      .post("/auth/register")
      .send({
        username: "test1234",
      })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it("OK, Login the user with valid inputs", (done) => {
    request(app)
      .post("/auth/login")
      .send({ email: mockUser.email, password: mockUser.password })
      .end((err, res) => {
        const body = res.body;
        expect(res.statusCode).to.equal(200);
        expect(body).to.have.property("token");
        expect(body).to.have.property("username");
        expect(body).to.have.property("email");
        expect(body).to.have.property("image").to.have.keys("id", "url");
        expect(body).to.have.property("friends").with.lengthOf(0);
        done();
      });
  });

  it("FAIL, Login the user with invalid inputs", (done) => {
    request(app)
      .post("/auth/login")
      .send({ email: mockUser.email, password: "12345" })
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it("FAIL, Login the user with missing inputs", (done) => {
    request(app)
      .post("/auth/login")
      .send({})
      .end((err, res) => {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });
});
