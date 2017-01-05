var send = require('./send');
var preferences = require('./preferences');
var storage = require('../libs/storage');

var announcements = storage.getObject('announcementArr', []);

// Sends announcements after the specified delay.
(function announcementCheck(i) {
    i = (i >= announcements.length) ? 0 : i;

    var ann = announcements[i];

    if (ann && ann.message) {
        send(ann.message);
    }
    setTimeout(announcementCheck, preferences.announcementDelay * 60000, i + 1);
})(0);
