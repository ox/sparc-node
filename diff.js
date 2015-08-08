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

Diff.prototype.NeedsReview = function () {
  return this.statusName === 'Needs Review';
}

Diff.prototype.NeedsRevision = function () {
  return this.statusName === 'Needs Revision';
}

Diff.prototype.Accepted = function () {
  return this.statusName === 'Accepted';
}


module.exports = Diff;
