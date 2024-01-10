"use strict";

const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require('../expressError');

describe(" ", function () {

  test("whether js names translate to sql names for valid inputs", function () {
    const dataToUpdate = {
      testValue: "test value",
      anotherTestValue: "another test value"
    };
    const jsToSql = {
      testValue: "test_value",
      anotherTestValue: "another_test_value",
    };

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: `"${jsToSql.testValue}"=$1, "${jsToSql.anotherTestValue}"=$2`,
      values: [dataToUpdate.testValue, dataToUpdate.anotherTestValue]
    });
  });

  test("whether providing no keys throws an error", function () {
    const dataToUpdate = {};
    const jsToSql = {};

    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql))
     .toThrow(new BadRequestError('No data'));
  });

  test("whether names col is using idx if name is not in jsToSql", function () {
    const dataToUpdate = {
      testValue: "test value",
      anotherTestValue: "another test value"
    };
    const jsToSql = {};

    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result).toEqual({
      setCols: `"testValue"=$1, "anotherTestValue"=$2`,
      values: [dataToUpdate.testValue, dataToUpdate.anotherTestValue]
    });
  });
});