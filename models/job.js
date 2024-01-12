"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


class Job {

  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(`
                INSERT INTO jobs (title,
                                  salary,
                                  equity,
                                  company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"`, [
      title,
      salary,
      equity,
      companyHandle,
    ]);

    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Optional: Search for jobs based on user's query.
   *
   * Optional input query object with at least one of following keys:
   * { title, minSalary, hasEquity }
   * Default as empty object.
   *
   * Returns [{ title, salary, equity, company_handle }, ...]
   * */

  static async findAll(query = {}) {

    const titleIncluded = 'title' in query;
    const minSalaryIncluded = 'minSalary' in query;
    const hasEquityIncluded = 'hasEquity' in query;

    const dbQuery = this._buildDbQuery(
      titleIncluded, minSalaryIncluded, hasEquityIncluded
    );

    let queryValues = [];
    if (titleIncluded && minSalaryIncluded) {
      queryValues = [`%${query.title}%`, query.minSalary];
    }
    else if (titleIncluded) {
      queryValues = [`%${query.title}%`];
    }
    else if (minSalaryIncluded) {
      queryValues = [query.minSalary];
    }

    console.log('query String', dbQuery);
    console.log('query values', queryValues);

    const result = await db.query(dbQuery, queryValues);

    return result.rows;
  }

  /**
   *  Build the SQL necessary to query the database for jobs
   *  in the findAll function.
   *  Input: booleans for whether query parameters are included
   *  Output: SQL statement as a string
   *
   *  E.g.,
   *  Input: [ titleIncluded, minSalaryIncluded, hasEquityIncluded ]
   *  Output: 'SELECT title, salary, equity, company_handle AS "companyHandle"
   *           FROM jobs
   *           WHERE title ILIKE $1 AND
   *                 salary >= $2 AND
   *                 equity > 0
   *           ORDER BY title
   */

  static _buildDbQuery(titleIncluded, minSalaryIncluded, hasEquityIncluded) {

    const whereClauses = [];

    let valueCount = 1;
    if (titleIncluded) {
      whereClauses.push(`title ILIKE $${valueCount}`);
      valueCount++;
    }

    if (minSalaryIncluded) {
      whereClauses.push(`salary >= $${valueCount}`);
      valueCount++;
    }

    if (hasEquityIncluded) {
      whereClauses.push('equity > 0');
    }

    let whereClause = '';
    if (whereClauses.length > 0) {
      whereClause = `WHERE ${whereClauses.join(' AND ')}`;
    }

    return `SELECT id, title, salary, equity, company_handle AS "companyHandle"
              FROM jobs
              ${whereClause}
              ORDER BY title`;
  }


  // /** Given a job id, return data about that job.
  //  *
  //  * Returns { title, salary, equity, company_handle }
  //  *
  //  * Throws NotFoundError if not found.
  //  **/

  static async get(jobId) {
    const jobRes = await db.query(`
        SELECT id,
               title,
               salary,
               equity,
               company_handle AS "companyHandle"
        FROM jobs
        WHERE id = $1`, [jobId]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${jobId}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {title, salary, equity, companyHandle}

   * Throws NotFoundError if not found.
   */

  static async update(jobId, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        title: "title",
        salary: "salary",
        equity: "equity",
        companyHandle: "company_handle"
      });
    const jobIdVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${jobIdVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, jobId]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${jobId}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(jobId) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [jobId]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${jobId}`);
  }

}


module.exports = Job;