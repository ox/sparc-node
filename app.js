var url = require('url');
var child_process = require('child_process');

var app = require('app');
var Menu = require('menu');
var Tray = require('tray');
var Q = require('q');
var opener = require('opener');
var Immutable = require('immutable');
var notifier = require('node-notifier');
var differ = require('jsondiffpatch');

var config = require('./config.js');
var Diff = require('./diff.js');
var Sparc = require('./sparc.js');
var sparc = new Sparc(config.hosts);

var appIcon = null;

// Holds the interval for checking for diff changes
var diffCheckingInterval = null;

// Mapping of Diff URI to diff. Used to track Diff state changes
var cachedDiffs = Immutable.Map({});

// pollPhabricator takes a user PHID and queries all of the accepted and open
// diffs that the user authored.
function pollPhabricator(userPhid) {
  sparc.exec('user.whoami')
    .then(function (user) {
      return Q.all(user.map(function (me) {
        return Q.all([
          sparc.exec('differential.query', {status: 'status-open', authors: [me.phid]}),
          sparc.exec('differential.query', {status: 'status-open', reviewers: [me.phid]}),
          ]);
      }));
    })
  .then(function (results) {
    var newCache = Immutable.Map({});

    var contextMenuItems = [];

    for (var i = 0; i < results.length; i++) {
      var sets = results[i];
      var hostname = sparc.hosts[i].targetParts.hostname;

      contextMenuItems.push({
        label: hostname,
        enabled: false
      });

      // The first set is authored diffs, the next set are the diffs that are
      // being reviewed
      var setNames = ["authored", "reviewing"];

      for (var j = 0; j < sets.length; j++) {
        var diffs = sets[j];

        // own is true if this is a Diff we authored
        var own = j === 0;

        // other is true if this is a Diff written by someone else
        var other = j === 1;

        contextMenuItems.push({
          label: setNames[j] + ':',
          enabled: false
        });

        for (var k = 0; k < diffs.length; k++) {
          var diff = new Diff(diffs[k]);

          contextMenuItems.push({
            label: 'D' + diff.id + ' ' + diff.statusName + ' "' +diff.title.slice(0, 18) + '..."',
            click: opener.bind(this, diff.uri)
          });

          var cached = cachedDiffs.get(diff.uri);

          var change = differ.diff(cached, diff);
          if (!!change) {
            console.log("%j", change);
          }

          if (!cached || cached.status !== diff.status) {
            // notify that an authored diff changed state, or if a new diff needs review
            if ((own && (diff.NeedsRevision() || diff.Accepted())) || (other && diff.NeedsReview())) {
              console.log('notifying user about D' + diff.id);
              notifier.notify({
                title: 'D' + diff.id + ' ' + diff.statusName,
                message: diff.title,
                open: diff.uri
              });
            }
          }

          // cache the new diff state
          newCache = newCache.set(diff.uri, diff);
        }
      }

      // Add a separator after every host
      contextMenuItems.push({
        type: 'separator'
      });
    }

    // TODO(artem): go over every diff that we used to have, decide if it
    // was closed (you were reviewing a diff and it was landed), and notify
    // you about it

    cachedDiffs = newCache;

    contextMenuItems.push({
      label: 'Exit',
      click: app.quit
    });

    var contextMenu = Menu.buildFromTemplate(contextMenuItems);
    appIcon.setContextMenu(contextMenu);
  });
}

function startPhabricatorPoll () {
  // Poll phabricator once
  pollPhabricator();

  // Then poll again every  60 seconds
  diffCheckingInterval = setInterval(pollPhabricator, 10000);
}

function stopPhabricatorPoll () {
  clearInterval(diffCheckingInterval);
}

function restartPhabricatorPoll () {
  stopPhabricatorPoll();
  startPhabricatorPoll();
}

app.on('ready', function () {
  if (app.dock) app.dock.hide();

  appIcon = new Tray(__dirname + '/IconTemplate.png');
  appIcon.setToolTip('SPARC – Keep track of your Diffs');

  var contextMenu = Menu.buildFromTemplate([
    { label: 'Loading...', enabled: false },
    { label: 'Exit', click: app.quit }
  ]);
  appIcon.setContextMenu(contextMenu);

  startPhabricatorPoll();

  app.on('closed', function () {
    stopPhabricatorPoll();
  });
});
