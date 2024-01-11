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
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      newJob,
    ]);
  });

  test("works for adding dupe job", async function () {
    await Job.create(newJob);
    await Job.create(newJob);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE title = 'new'`);
    expect(result.rows).toEqual([
      newJob,
      newJob,
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    const jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "j1",
        salary: 1000,
        equity: "0.01",
        companyHandle: 'c1',
      },
      {
        title: "j2",
        salary: 2000,
        equity: "0.02",
        companyHandle: 'c2',
      },
      {
        title: "j3",
        salary: 3000,
        equity: "0.03",
        companyHandle: 'c2',
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
      },
      {
        title: "j3",
        salary: 3000,
        equity: "0.03",
        companyHandle: 'c2',
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
      },
      {
        title: "j2",
        salary: 2000,
        equity: "0.02",
        companyHandle: 'c2',
      },
      {
        title: "j3",
        salary: 3000,
        equity: "0.03",
        companyHandle: 'c2',
      },
    ]);
  });

  test("works: with two filters, 2 results", async function () {
    const query = {
      title: 'j',
      minSalary: 1500
    };
    const jobs = await Job.findAll(query);
    expect(companies).toEqual([
      {
        title: "j2",
        salary: 2000,
        equity: "0.02",
        companyHandle: 'c2',
      },
      {
        title: "j3",
        salary: 3000,
        equity: "0.03",
        companyHandle: 'c2',
      },
    ]);
  });

});

// /************************************** get */

// describe("get", function () {
//   test("works", async function () {
//     let company = await Company.get("c1");
//     expect(company).toEqual({
//       handle: "c1",
//       name: "C1",
//       description: "Desc1",
//       numEmployees: 1,
//       logoUrl: "http://c1.img",
//     });
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.get("nope");
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });

// /************************************** update */

// describe("update", function () {
//   const updateData = {
//     name: "New",
//     description: "New Description",
//     numEmployees: 10,
//     logoUrl: "http://new.img",
//   };

//   test("works", async function () {
//     let company = await Company.update("c1", updateData);
//     expect(company).toEqual({
//       handle: "c1",
//       ...updateData,
//     });

//     const result = await db.query(
//           `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`);
//     expect(result.rows).toEqual([{
//       handle: "c1",
//       name: "New",
//       description: "New Description",
//       num_employees: 10,
//       logo_url: "http://new.img",
//     }]);
//   });

//   test("works: null fields", async function () {
//     const updateDataSetNulls = {
//       name: "New",
//       description: "New Description",
//       numEmployees: null,
//       logoUrl: null,
//     };

//     let company = await Company.update("c1", updateDataSetNulls);
//     expect(company).toEqual({
//       handle: "c1",
//       ...updateDataSetNulls,
//     });

//     const result = await db.query(
//           `SELECT handle, name, description, num_employees, logo_url
//            FROM companies
//            WHERE handle = 'c1'`);
//     expect(result.rows).toEqual([{
//       handle: "c1",
//       name: "New",
//       description: "New Description",
//       num_employees: null,
//       logo_url: null,
//     }]);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.update("nope", updateData);
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });

//   test("bad request with no data", async function () {
//     try {
//       await Company.update("c1", {});
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof BadRequestError).toBeTruthy();
//     }
//   });
// });

// /************************************** remove */

// describe("remove", function () {
//   test("works", async function () {
//     await Company.remove("c1");
//     const res = await db.query(
//         "SELECT handle FROM companies WHERE handle='c1'");
//     expect(res.rows.length).toEqual(0);
//   });

//   test("not found if no such company", async function () {
//     try {
//       await Company.remove("nope");
//       throw new Error("fail test, you shouldn't get here");
//     } catch (err) {
//       expect(err instanceof NotFoundError).toBeTruthy();
//     }
//   });
// });
