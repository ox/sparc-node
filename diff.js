function Diff (opts) {
  if (!opts) opts = {};

  this.id = opts.id;
  this.uri = opts.uri;
  this.title = opts.title;
  this.status = opts.status;
  this.statusName = opts.statusName;
}

Diff.prototype.toString = function () {
  return '[' + this.statusName + '] D' + this.id + ' ' + this.title;
};

module.exports = Diff;
