/*
 * SPARC will fetch diffs you need to review or are waiting to be reviewed
 */
var Q = require('q');
var Immutable = require('immutable');
var notifier = require('node-notifier');

var config = require('./config.js');
var Phabricator = require('./phabricator.js');
var Diff = require('./diff.js');

// var host = Object.keys(config.hosts)[0];
// var token = config.hosts[host].token;
// var phabricator = new Phabricator(host, token);

function Sparc(hosts) {
  if (!hosts) hosts = [];

  if (hosts.length === 0) {
    throw "No hosts passed into SPARC constructor";
  }

  // hosts is a list of Phabricator instances which
  // we will query
  this.hosts = [];

  // iterate over each host given and create a Phabricator instance that we
  // can use to query for stuff.
  for (var host in hosts) {
    if (!hosts[host].token) {
      throw "No token available for " + host;
    }

    this.hosts.push(new Phabricator(host, hosts[host].token));
  }
}

// exec will run a query on every host and return a flattened array of results
Sparc.prototype.exec = function (endpoint, opts) {
  if (!opts) opts = {};

  var promises = this.hosts.map(function (host) {
    return host.exec(endpoint, opts);
  });

  return Q.all(promises)
    .then(function (results) {
      var flat = [].concat.apply([], results);
      return flat;
    });
};

module.exports = Sparc;
