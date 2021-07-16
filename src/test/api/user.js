const expect = require("chai").expect;
const request = require("supertest");
const app = require("../../index");

const { connectDB, closeDB } = require("../../configs/mongo");

const mockUser1 = {
  username: "testuser1",
  email: "testemail1@gmail.com",
  password: "testpassword",
};

const mockUser2 = {
  username: "testuser2",
  email: "testemail2@gmail.com",
  password: "testpassword",
};

let userToken1, userToken2;

describe("User routes tests", () => {
  //Register two users get their auth token before running the tests
  before((done) => {
    connectDB()
      .then(() => {
        request(app)
          .post("/auth/register")
          .send(mockUser1)
          .end((err, res) => {
            if (err) return done(err);
            request(app)
              .post("/auth/login")
              .send({ email: mockUser1.email, password: mockUser1.password })
              .end((err, res) => {
                if (err) return done(err);
                userToken1 = res.body.token;
              });
          });
        request(app)
          .post("/auth/register")
          .send(mockUser2)
          .end((err, res) => {
            if (err) return done(err);
            request(app)
              .post("/auth/login")
              .send({
                email: mockUser2.email,
                password: mockUser2.password,
              })
              .end((err, res) => {
                if (err) return done(err);
                userToken2 = res.body.token;

                done();
              });
          });
      })
      .catch((err) => done(err));
  });

  after((done) => {
    closeDB()
      .then(() => done())
      .catch((err) => done(err));
  });

  it("FAIL, Get friend list of an user (without token)", (done) => {
    request(app)
      .get("/user/friends")
      .end((err, res) => {
        expect(res.statusCode).to.equal(401);
        done();
      });
  });

  it("OK, Get friend list of an user", (done) => {
    request(app)
      .get("/user/friends")
      .set({ Authorization: `Bearer ${userToken1}` })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property("friends");
        done();
      });
  });

  it("FAIL, Get friend list of an user (without token)", (done) => {
    request(app)
      .get("/user/friends")
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(401);
        done();
      });
  });

  it("FAIL, Search a user (not found)", (done) => {
    request(app)
      .get(`/search/user?query=somerandomusername`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(404);
        done();
      });
  });

  it("FAIL, Search a user (empty query)", (done) => {
    request(app)
      .get(`/search/user?query=`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(404);
        done();
      });
  });

  it("FAIL, Search a user (search themself)", (done) => {
    request(app)
      .get(`/search/user?query=${mockUser1.username}`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(404);
        done();
      });
  });

  it("OK, Search mockuser2 by mockeruser1 (found)", (done) => {
    request(app)
      .get(`/search/user?query=${mockUser2.username}`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .end((err, res) => {
        if (err) return done(err);
        const body = res.body;
        expect(res.statusCode).to.equal(200);
        expect(body).to.have.keys("_id", "username", "image");
        mockUser2._id = res.body._id;
        done();
      });
  });

  it("OK, Search mockuser1 by mockeruser2 (found)", (done) => {
    request(app)
      .get(`/search/user?query=${mockUser1.username}`)
      .set({ Authorization: `Bearer ${userToken2}` })
      .end((err, res) => {
        if (err) return done(err);
        const body = res.body;
        expect(res.statusCode).to.equal(200);
        expect(body).to.have.keys("_id", "username", "image");
        mockUser1._id = res.body._id;
        done();
      });
  });

  it("FAIL, Add friend (without token)", (done) => {
    request(app)
      .post(`/user/addfriend`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(401);
        done();
      });
  });

  it("FAIL, Add friend (without userID)", (done) => {
    request(app)
      .post(`/user/addfriend`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it("FAIL, Add friend (invalid userID)", (done) => {
    request(app)
      .post(`/user/addfriend`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .send({ userID: "somerandomuserid" })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it("OK, Add friend (mockuser1 added mockuser2)", (done) => {
    request(app)
      .post(`/user/addfriend`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .send({ userID: mockUser2._id })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        expect(res.body).to.have.property("friends").with.lengthOf(1);
        const friend = res.body.friends[0];
        expect(friend).to.have.keys("_id", "user", "status", "time");
        expect(friend.user).to.equal(mockUser2._id);
        expect(friend.status).to.equal(3);
        done();
      });
  });

  //test to see if a user can send multiple friend req (add already added user)

  it("FAIL, Add friend (mockuser1 added mockuser2, 2nd attempt)", (done) => {
    request(app)
      .post(`/user/addfriend`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .send({ userID: mockUser2._id })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property("isfriend").equal(true);
        expect(res.body).to.have.property("status").equal(3); //status 3 because the friend req is pending, the other user have not accepted the req yet
        done();
      });
  });

  //if user1 have a pending friend req from user2, user2 cannot send friend req again to user1

  it("FAIL, Add friend (mockuser2 added mockuser1, if one of the user have already added the other one)", (done) => {
    request(app)
      .post(`/user/addfriend`)
      .set({ Authorization: `Bearer ${userToken2}` })
      .send({ userID: mockUser1._id })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(400);
        expect(res.body).to.have.property("isfriend").equal(true);
        expect(res.body).to.have.property("status").equal(2); //status 2 because this user already have a pending friend req from the user he is trying to add
        done();
      });
  });

  it("FAIL, accept friend request (without userID)", (done) => {
    request(app)
      .post(`/user/acceptfriendrequest`)
      .set({ Authorization: `Bearer ${userToken2}` })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it("FAIL, accept friend request (invalid userID)", (done) => {
    request(app)
      .post(`/user/acceptfriendrequest`)
      .set({ Authorization: `Bearer ${userToken2}` })
      .send({ userID: "somerandomid" })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it("OK, accept friend request", (done) => {
    request(app)
      .post(`/user/acceptfriendrequest`)
      .set({ Authorization: `Bearer ${userToken2}` })
      .send({ userID: mockUser1._id })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it("OK, remove friend", (done) => {
    request(app)
      .post(`/user/removefriend`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .send({ userID: mockUser2._id })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it("FAIL, remove friend (without token)", (done) => {
    request(app)
      .post(`/user/removefriend`)
      .send({ userID: mockUser2._id })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(401);
        done();
      });
  });

  it("FAIL, remove friend (without userID)", (done) => {
    request(app)
      .post(`/user/removefriend`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it("OK, reject friend request", (done) => {
    request(app)
      .post(`/user/addfriend`)
      .set({ Authorization: `Bearer ${userToken1}` })
      .send({ userID: mockUser2._id })
      .end((err, res) => {
        if (err) return done(err);
        request(app)
          .post(`/user/rejectfriendrequest`)
          .set({ Authorization: `Bearer ${userToken2}` })
          .send({ userID: mockUser1._id })
          .end((err, res) => {
            if (err) return done(err);
            expect(res.statusCode).to.equal(200);
            done();
          });
      });
  });
});
