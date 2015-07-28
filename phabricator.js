var https = require('https');
var url = require('url');
var qs = require('qs');
var util = require('util');
var extend = require('util')._extend;
var Q = require('q');

function Phabricator(host, token) {
  if (!host) {
    throw "No host given to Phabricator init";
  }

  if (!token) {
    throw "Missing `token`. Cannot auth without it";
  }

  this.host = host;
  this.token = token;
}

Phabricator.prototype.exec = function (endpoint, opts) {
  if (!opts) { opts = {} }
  opts['api.token'] = this.token;

  if (!this.targetParts) {
    this.targetParts = url.parse(this.host);
  }

  var urlOpts = extend(this.targetParts, {
    pathname: '/api/' + endpoint,
      search: qs.stringify(opts)
  });

  var apiPath = url.format(urlOpts);

  var deferred = Q.defer();
  https.get(apiPath, function (res) {
    var body = '';

    res.on('data', function(chunk) {
        body += chunk;
    });

    res.on('end', function() {
      var ret = JSON.parse(body);

      if (ret.result == null) {
        deferred.reject({
          code: ret.error_code,
          info: ret.error_info
        });
      } else {
        deferred.resolve(ret.result);
      }
    });
  }).on('error', function (error) {
    deferred.reject(error);
  });

  return deferred.promise;
};

module.exports = Phabricator;
