"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdminLoggedIn } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, equity, companyHandle, salary }
 *
 * Returns { id, title, equity, companyHandle, salary }
 *
 * Authorization required: admin login
 */

router.post("/", ensureAdminLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { jobs: [ { id, title, equity, companyHandle, salary }, ...] }
 *
 * Can filter on one or more of optional provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  console.log('running get jobs, query:', req.query);

  const queryParams = Object.keys(req.query);

  if (queryParams.length > 0) {
    const allowedFilters = ['title', 'minSalary', 'hasEquity'];
    const nonallowedFilters = queryParams.filter(
      param => !allowedFilters.includes(param)
    );

    if (nonallowedFilters.length > 0) {
      throw new BadRequestError(
        "Allowed search fields: title, minSalary, maxEmployees"
      );
    }
  }

  let query = req.query;

  if (req.query === null) {
    query = {};
  }

  const jobs = await Job.findAll(query);
  console.log('jobs',jobs)
  return res.json({ jobs });
});

/** GET /[id]=>  { id }
 *
 *  Job is { id, title, equity, companyHandle, salary }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);
  return res.json({ job });
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch("/:handle", ensureAdminLoggedIn, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    companyUpdateSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const company = await Company.update(req.params.handle, req.body);
  return res.json({ company });
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:handle", ensureAdminLoggedIn, async function (req, res, next) {
  await Company.remove(req.params.handle);
  return res.json({ deleted: req.params.handle });
});


module.exports = router;
