"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  // Note: equity returned as a string in pg in order to maintain precision
  const newJob = {
    title: "new",
    salary: 1,
    equity: "0.01",
    companyHandle: 'c1',
  };

  test("works", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual({ ...newJob, id: expect.any(Number) });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      { ...newJob, id: expect.any(Number) }
    ]);
  });

  test("works for adding dupe job", async function () {
    await Job.create(newJob);
    await Job.create(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE title = 'new'`);
    expect(result.rows).toEqual([
      { ...newJob, id: expect.any(Number) },
      { ...newJob, id: expect.any(Number) }
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    const jobs = await Job.findAll();
    console.log('jobs in job.test.js', jobs)
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: with all filters", async function () {
    const query = {
      title: 'j',
      minSalary: 1500,
      hasEquity: true
    };
    const jobs = await Job.findAll(query);
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: with only title filter, multiple results", async function () {
    const query = {
      title: 'j'
    };
    const jobs = await Job.findAll(query);
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: with two filters, 2 results", async function () {
    const query = {
      title: 'j',
      minSalary: 1500
    };
    const jobs = await Job.findAll(query);
    expect(jobs).toEqual([
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
    ]);
  });

  test("works: no results", async function () {
    const query = {
      title: 'test non-existant job',
      minSalary: 999999
    };
    const jobs = await Job.findAll(query);
    expect(jobs).toEqual([]);
  });

});

// /************************************** get */

describe("get", function () {
  test("works", async function () {
    const result = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = result.rows[0].id;

    const job = await Job.get(testJobId);
    console.log("******* testJobId: ", testJobId);
    expect(job).toEqual({
      title: "j1",
      salary: 1000,
      equity: "0.01",
      companyHandle: "c1",
      id: expect.any(Number),
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

// /************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Title",
    salary: 1001,
    equity: "0.011",
    companyHandle: "c3",
  };

  test("works", async function () {
    const idResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = idResult.rows[0].id;
    const job = await Job.update(testJobId, updateData);
    expect(job).toEqual({ ...updateData, id: expect.any(Number) });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${testJobId}`);
    expect(result.rows[0]).toEqual({ ...updateData, id: expect.any(Number) });
  });

  test("works: null fields", async function () {
    const idResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = idResult.rows[0].id;
    const updateDataSetNulls = {
      title: "j1",
      salary: null,
      equity: null,
      companyHandle: "c1",
    };

    let job = await Job.update(testJobId, updateDataSetNulls);
    expect(job).toEqual({ ...updateDataSetNulls, id: expect.any(Number) });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = ${testJobId}`);
    expect(result.rows[0]).toEqual(
      { ...updateDataSetNulls, id: expect.any(Number) }
    );
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(0, updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const idResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = idResult.rows[0].id;

    try {
      await Job.update(testJobId, {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const idResult = await db.query(`SELECT id FROM jobs WHERE title = 'j1';`);
    const testJobId = idResult.rows[0].id;

    await Job.remove(testJobId);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${testJobId}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
