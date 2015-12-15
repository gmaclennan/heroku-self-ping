"use strict";

var request = require('request');

module.exports = function herokuSelfPing(url, options) {
  if(!options) {
    options = {};
  }

  var wakeUpTime = (options.start || '6:00').split(':').map(function (i) {
    return parseInt(i, 10);
  });
  var sleepTime = (options.end || '22:00').split(':').map(function (i) {
    return parseInt(i, 10);
  });

  var wakeUpOffset = (60 * wakeUpTime[0] + wakeUpTime[1]) % (60 * 24);
  var awakeMinutes = (60 * (sleepTime[0] + 24) + sleepTime[1] - wakeUpOffset) % (60 * 24);

  options.interval = options.interval || 20 * 1000 * 60;
  options.logger = options.logger || console.log;
  options.verbose = options.verbose || false;

  var isHeroku = require("is-heroku");

  if(!url) {
    options.verbose && options.logger("heroku-self-ping: no url provided. Exiting.");
    return false;
  }
  if(!isHeroku) {
    options.verbose && options.logger("heroku-self-ping: heroku not detected. Exiting.");

    return false;
  }

  options.verbose && options.logger("heroku-self-ping: Setting up hearbeat to " + url + " every " + options.interval + "ms.");

  return setInterval(function() {
    var now = new Date()
    var elapsedMinutes = (60 * (now.getHours() + 24) + now.getMinutes() - wakeUpOffset) % (60 * 24)

    if (elapsedMinutes < awakeMinutes) {
      options.logger("heroku-self-ping: Sending hearbeat to " + url);
      request(url, function (err) {
        if (err) options.logger.error("keepalive pong:", err);
      })
    } else {
      options.logger.info("Skipping keep alive, time to rest");
    }
  }, options.interval);
};
