"use strict";

const { sqlForPartialUpdate } = require("./sql");

describe(" ", function () {

  test(" ", function () {
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
});