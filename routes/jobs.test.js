"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New",
    salary: 1001,
    equity: 0.1,
    companyHandle: "c3",
  };

  test("ok for admins", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      Job: { ...newJob, id: expect.any(Number) },
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: 1001,
        companyHandle: "c3",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "New",
        salary: "test invalid salary input",
        equity: 0.1,
        companyHandle: "c3",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
        [
          {
            title: "j1",
            salary: 1000,
            equity: "0.01",
            companyHandle: 'c1',
            id: expect.any(Number),
          },
          {
            title: "j2",
            salary: 2000,
            equity: "0.02",
            companyHandle: 'c2',
            id: expect.any(Number),
          },
          {
            title: "j3",
            salary: 3000,
            equity: "0.03",
            companyHandle: 'c2',
            id: expect.any(Number),
          },
        ],
    });
  });

  test("filter results based on optional criteria", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        title: 'j3',
        minSalary: '1',
        hasEquity: true,
      });

    expect(resp.body).toEqual({
      jobs:
        [
          {
            title: "j3",
            salary: 3000,
            equity: "0.03",
            companyHandle: 'c2',
            id: expect.any(Number),
          },
        ],
    });
  });

  test("errors: with filter for additional field", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        title: 'j3',
        minSalary: '1',
        hasEquity: true,
        additionalField: 'test'
      });

    expect(resp.body).toEqual({
      "error": {
        "message": "Allowed search fields: title, minSalary, maxEmployees",
        "status": 400
      }
    });
  });

  test("has equity defaults to false if not included", async function () {
    const resp = await request(app)
      .get("/jobs")
      .query({
        title: 'j3',
        minSalary: '1',
      });

    expect(resp.body).toEqual({ jobs: [] });
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app).get(`/jobs/${testJobId}`);
    expect(resp.body).toEqual({
      job: {
        title: "j1",
        salary: 1000,
        equity: "0.01",
        companyHandle: 'c1',
        id: testJobId,
      },
    });
  });

  test("not found for no such Job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${testJobId}`)
      .send({
        title: "new",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      job: {
        title: "new",
        salary: 1000,
        equity: "0.01",
        companyHandle: 'c1',
        id: testJobId,
      },
    });
  });

  test("unauth for non-admin users", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${testJobId}`)
      .send({
        title: "new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${testJobId}`)
      .send({
        title: "new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such Job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${testJobId}`)
      .send({
        id: 99,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app)
      .patch(`/jobs/${testJobId}`)
      .send({
        salary: -100000,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app)
      .delete(`/jobs/${testJobId}`)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({ deleted: testJobId });
  });

  test("unauth for non-admin users", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app)
      .delete(`/jobs/${testJobId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const resp = await request(app)
      .delete(`/jobs/${testJobId}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such Job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
