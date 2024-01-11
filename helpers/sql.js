"use strict";

const { BadRequestError } = require("../expressError");

/** Prep data object to be used in partial sql update.
 * Converts js key names to corresponding sql column names.
 *
 * Input obj with data to update and jsToSql obj,
 * return obj with cols str and values to update
 *
 * {firstName: 'Aliya', age: 32}, {firstName: 'first_name', age: 'age'}
 * ->
 * {setCols: '"first_name"=$1, "age"=$2', values: ['Aliya', 32]}
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
