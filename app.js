var url = require('url');
var child_process = require('child_process');

var app = require('app');
var Menu = require('menu');
var Tray = require('tray');
var Q = require('q');

var config = require('./config.js');
var Phabricator = require('./phabricator.js');

var host = Object.keys(config.hosts)[0];
var hostParts = url.parse(host);
var token = config.hosts[host].token;
var phabricator = new Phabricator(host, token);

var appIcon = null;

var user = {};
var diffTimeout = null;

function openDiffInBrowser(diffID) {
  return function () {
    var diffUrl = url.format({
      hostname: hostParts.hostname,
      protocol: hostParts.protocol,
      pathname: '/D' + diffID
    });

    console.log('opening Diff at ' + diffUrl);

    child_process.spawn('open', [diffUrl], {detached: true});
  }
}

function makeMenuItemTemplateFromDiffs(diffs) {
  var newContextMenuItems = [];

  for (var i = 0; i < diffs.length; i++) {
    var diff = diffs[i];
    newContextMenuItems.push({
      label: 'D' + diff.id + '[' + diff.statusName + ']',
      click: openDiffInBrowser(diff.id)
    });
  }

  return newContextMenuItems;
}

function pollPhabricator(userPhid) {
  var promises = [];
  var queryStatuses = ['status-accepted', 'status-open'];

  for (var i in queryStatuses) {
    var promise = phabricator.exec('differential.query', {
        authors: [userPhid],
        status: queryStatuses[i],
        order: 'order-created',
        limit: 1
      })
      .fail(function (err) {
        throw err;
      });

    promises.push(promise);
  }

  return Q.all(promises)
    .then(function () {
        var flatDiffs = [].concat.apply([], promises);
        var newContextMenuItems = makeMenuItemTemplateFromDiffs(flatDiffs);
        var contextMenu = Menu.buildFromTemplate(newContextMenuItems);
        appIcon.setContextMenu(contextMenu);
    }).done();
}

function startPhabricatorPoll () {
  return phabricator.exec('user.whoami')
    .then(function (me) {
      user = me;

      // Poll phabricator once
      pollPhabricator(me.phid);

      // Then poll again every  60 seconds
      diffTimeout = setTimeout(pollPhabricator.bind(this, me.phid), 60000);
    })
    .fail(function (err) {
      console.log(err);
      throw err;
    });
}

function stopPhabricatorPoll () {
 clearTimeout(diffTimeout);
}

app.on('ready', function () {
  app.dock.hide();

  appIcon = new Tray('./IconTemplate@2x.png');
  appIcon.setToolTip('SPARC – Keep track of your Diffs');

  var contextMenu = Menu.buildFromTemplate([
    { label: 'Loading', enabled: false },
    { label: 'Exit', click: app.quit }
  ]);
  appIcon.setContextMenu(contextMenu);

  startPhabricatorPoll();

  app.on('closed', function () {
    stopPhabricatorPoll();
  });
});
