#!/usr/bin/env node

'use strict';

const importLocal = require('import-local');
const npmAuth = require('./index');

if (importLocal(__filename)) {
  require('npmlog').info('cli', 'using local version of lerna');
} else {
  new npmAuth();
}
