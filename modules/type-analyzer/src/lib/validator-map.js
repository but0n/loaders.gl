// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

import * as CONSTANT from './constant';
import * as Utils from './utils';

const DATA_TYPES = CONSTANT.DATA_TYPES;
const VALIDATOR_MAP = {};

// geometry
VALIDATOR_MAP[DATA_TYPES.GEOMETRY] = Utils.isGeographic;
VALIDATOR_MAP[DATA_TYPES.GEOMETRY_FROM_STRING] = Utils.buildRegexCheck('isStringGeometry');
VALIDATOR_MAP[DATA_TYPES.PAIR_GEOMETRY_FROM_STRING] = Utils.buildRegexCheck(
  'isPairwisePointGeometry'
);

// basic boolean: true/false, 0/1
VALIDATOR_MAP[DATA_TYPES.BOOLEAN] = Utils.isBoolean;
VALIDATOR_MAP[DATA_TYPES.ARRAY] = Utils.isArray;
VALIDATOR_MAP[DATA_TYPES.OBJECT] = Utils.isObject;

// prefix/postfix rules: '$30.00', '10.05%'
VALIDATOR_MAP[DATA_TYPES.CURRENCY] = Utils.buildRegexCheck('isCurrency');
VALIDATOR_MAP[DATA_TYPES.PERCENT] = Utils.buildRegexCheck('isPercentage');

// times
VALIDATOR_MAP[DATA_TYPES.DATETIME] = Utils.buildRegexCheck('isDateTime');

VALIDATOR_MAP[DATA_TYPES.DATE] = Utils.buildRegexCheck('isDate');
VALIDATOR_MAP[DATA_TYPES.TIME] = Utils.buildRegexCheck('isTime');
// VALIDATOR_MAP[DATA_TYPES.DATETIME] = Utils.whichFormatDateTime;
//
// VALIDATOR_MAP[DATA_TYPES.DATE] = Utils.whichFormatDate;
// VALIDATOR_MAP[DATA_TYPES.TIME] = Utils.whichFormatTime;

// numbers:
// 1, 2, 3, +40, 15,121
const intRegexCheck = Utils.buildRegexCheck('isInt');
function isInt(value) {
  if (intRegexCheck(value)) {
    const asNum = parseInt(value.toString().replace(/(\+|,)/g, ''), 10);
    return asNum > Number.MIN_SAFE_INTEGER && asNum < Number.MAX_SAFE_INTEGER;
  }

  return false;
}
VALIDATOR_MAP[DATA_TYPES.INT] = isInt;

// 1.1, 2.2, 3.3
const floatRegexCheck = Utils.buildRegexCheck('isFloat');
function isFloat(value) {
  return floatRegexCheck(value) || isInt(value);
}
VALIDATOR_MAP[DATA_TYPES.FLOAT] = isFloat;

// 1, 2.2, 3.456789e+0
VALIDATOR_MAP[DATA_TYPES.NUMBER] = function isNumeric(row) {
  return !isNaN(row) || isInt(row) || isFloat(row);
};

// strings: '94101-10', 'San Francisco', 'Name'
VALIDATOR_MAP[DATA_TYPES.ZIPCODE] = Utils.buildRegexCheck('isZipCode');
VALIDATOR_MAP[DATA_TYPES.STRING] = Utils.isString;

export default VALIDATOR_MAP;