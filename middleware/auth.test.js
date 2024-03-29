"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdminLoggedIn,
  ensureAdminOrSpecificUserLoggedIn,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

function next(err) {
  if (err) throw new Error("Got error from middleware");
}


describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {};
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "test" } } };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: { } } };
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });
});

describe("ensureAdminLoggedIn", function () {
  test("works", function () {
    const req = {};
    const res = { locals: { user: { username: "testadmin", isAdmin: true } } };
    ensureAdminLoggedIn(req, res, next);
  });

  test("rejects a non-admin user", function () {
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    expect(() => ensureAdminLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureAdminLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: { } } };
    expect(() => ensureAdminLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });
});


describe("ensureAdminOrSpecificUserLoggedIn", function () {
  test("works for admin user", function () {
    const req = { params: { username: 'test'} };
    const res = { locals: { user: { username: "testadmin", isAdmin: true } } };
    ensureAdminOrSpecificUserLoggedIn(req, res, next);
  });

  test("works for a specific user", function () {
    const req = { params: { username: 'test'} };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    ensureAdminOrSpecificUserLoggedIn(req, res, next);
  });

  test("unauth for a non-matching user", function () {
    const req = { params: { username: 'anothertest'} };
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    expect(() => ensureAdminOrSpecificUserLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no login", function () {
    const req = {};
    const res = { locals: {} };
    expect(() => ensureAdminOrSpecificUserLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {};
    const res = { locals: { user: { } } };
    expect(() => ensureAdminOrSpecificUserLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });
});
