var api = require('./libs/blockheads');
var storage = require('./libs/storage');

const VERSION = '6.1.0';
storage.set('mb_version', VERSION, false);


var bot = module.exports = require('./exports');
