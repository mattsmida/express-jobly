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

  /** Find all companies.
   *
   * Optional: Search for companies based on user's query.
   *
   * Optional input query object with at least one of following keys:
   * { minEmployees, maxEmployees, nameLike }
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  // static async findAll(query) {
  //   let whereClause = '';
  //   const filters = {
  //     clauses: [],
  //     values: []
  //   };
  //   const filterToClause = {
  //     'minEmployees': 'num_employees >= $',
  //     'maxEmployees': 'num_employees <= $',
  //     'nameLike': 'name ILIKE $'
  //   };

  //   // Build where clause if applicable
  //   if (query !== undefined && Object.keys(query).length > 0) {
  //     if ('nameLike' in query) {
  //       query.nameLike = `%${query.nameLike}%`;
  //     }
  //     let filterCount = 1;
  //     for (const filter in query) {
  //       filters.clauses.push(`${filterToClause[filter]}${filterCount}`);
  //       filters.values.push(query[filter]);
  //       filterCount++;
  //     }
  //     whereClause = `WHERE ${filters.clauses.join('AND ')}`;
  //   }

  //   const companiesRes = await db.query(`
  //       SELECT handle,
  //              name,
  //              description,
  //              num_employees AS "numEmployees",
  //              logo_url      AS "logoUrl"
  //       FROM companies
  //       ${whereClause}
  //       ORDER BY name`, filters.values);
  //   return companiesRes.rows;
  // }

  // /** Given a company handle, return data about company.
  //  *
  //  * Returns { handle, name, description, numEmployees, logoUrl, jobs }
  //  *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
  //  *
  //  * Throws NotFoundError if not found.
  //  **/

  // static async get(handle) {
  //   const companyRes = await db.query(`
  //       SELECT handle,
  //              name,
  //              description,
  //              num_employees AS "numEmployees",
  //              logo_url      AS "logoUrl"
  //       FROM companies
  //       WHERE handle = $1`, [handle]);

  //   const company = companyRes.rows[0];

  //   if (!company) throw new NotFoundError(`No company: ${handle}`);

  //   return company;
  // }

  // /** Update company data with `data`.
  //  *
  //  * This is a "partial update" --- it's fine if data doesn't contain all the
  //  * fields; this only changes provided ones.
  //  *
  //  * Data can include: {name, description, numEmployees, logoUrl}
  //  *
  //  * Returns {handle, name, description, numEmployees, logoUrl}
  //  *
  //  * Throws NotFoundError if not found.
  //  */

  // static async update(handle, data) {
  //   const { setCols, values } = sqlForPartialUpdate(
  //     data,
  //     {
  //       numEmployees: "num_employees",
  //       logoUrl: "logo_url",
  //     });
  //   const handleVarIdx = "$" + (values.length + 1);

  //   const querySql = `
  //       UPDATE companies
  //       SET ${setCols}
  //       WHERE handle = ${handleVarIdx}
  //       RETURNING
  //           handle,
  //           name,
  //           description,
  //           num_employees AS "numEmployees",
  //           logo_url AS "logoUrl"`;
  //   const result = await db.query(querySql, [...values, handle]);
  //   const company = result.rows[0];

  //   if (!company) throw new NotFoundError(`No company: ${handle}`);

  //   return company;
  // }

  // /** Delete given company from database; returns undefined.
  //  *
  //  * Throws NotFoundError if company not found.
  //  **/

  // static async remove(handle) {
  //   const result = await db.query(`
  //       DELETE
  //       FROM companies
  //       WHERE handle = $1
  //       RETURNING handle`, [handle]);
  //   const company = result.rows[0];

  //   if (!company) throw new NotFoundError(`No company: ${handle}`);
  // }

}


module.exports = Job;