var url = require('url');
var child_process = require('child_process');

var app = require('app');
var Menu = require('menu');
var Tray = require('tray');
var Q = require('q');
var notifier = require('node-notifier');

var config = require('./config.js');
var Phabricator = require('./phabricator.js');
var Diff = require('./diff.js');

// TODO(artem): Create higher level construct called
// Sparc or something that will check all your diffs
// across all of your Phabricator accounts.
var host = Object.keys(config.hosts)[0];
var hostParts = url.parse(host);
var token = config.hosts[host].token;
var phabricator = new Phabricator(host, token);

var appIcon = null;

var user = {};
var diffTimeout = null;

// pollPhabricator takes a user PHID and queries all of the accepted and open
// diffs that the user authored.
// TODO(artem): Should poll for diffs the user needs to review, as well
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
      .then(function (diffs) {
        return diffs.map(function (diff) {
          return new Diff(diff);
        });
      })
      .fail(function (err) {
        throw err;
      });

    promises.push(promise);
  }

  return Q.all(promises)
    .then(function () {
        // Flatten the list of diffs for each status type
        var flatDiffs = [].concat.apply([], promises);
        var newContextMenuItems = flatDiffs.map(function (diff) { return diff.asMenuItem(); });

        // Notify the user of every diff status change
        //TODO(artem): actually check if the status changed from before
        flatDiffs.map(function (diff) {
          notifier.notify({
            title: 'D' + diff.id + ' ' + diff.statusName,
            message: 'D' + diff.id + ' changed it\'s status. Check it out!',
            open: diff.uri
          });
        });

        // Append the Exit option
        newContextMenuItems.push({label: "Exit", click: app.quit});

        // Set the menubar's context menu to the list of diffs
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
  if (app.dock) app.dock.hide();

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
