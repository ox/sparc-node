var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, '.arcrc');

module.exports = JSON.parse(fs.readFileSync(configDir, 'utf8'));

