const Shrewd = require('../dist/shrewd');

process.env.NODE_ENV = 'test';
process.env.TS_NODE_PROJECT = 'test/tsconfig.json';

Shrewd.option.autoCommit = false;
