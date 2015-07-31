var opener = require('opener');

function Diff (opts) {
  if (!opts) opts = {};

  this.id = opts.id;
  this.uri = opts.uri;
  this.status = opts.status;
  this.statusName = opts.statusName;
}

Diff.prototype.asMenuItem = function () {
  return {
    label: 'D' + this.id + ' [' + this.statusName + ']',
    click: opener(this.uri)
  };
};

module.exports = Diff;
