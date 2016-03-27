/*jshint
	browser: true
*/
/*global
	MessageBot
*/
var bot = {};

window.onerror = function(text, file, line, column) {
	if (!bot.devMode && text != 'Script error.') {
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/error.php?version= ' + bot.version + 'text=' + encodeURIComponent(report) + '&log2=' + encodeURIComponent(report2);
		document.head.appendChild(sc);
	}
};

bot = MessageBot();
bot.start();

//Tracking launches.
(function() {
	var s = document.createElement('script');
	s.src = '//blockheadsfans.com/messagebot/launch.php?name=' + encodeURIComponent(bot.core.ownerName) + '&id=' + window.worldId + '&world=' + encodeURIComponent(bot.core.worldName);
	document.head.appendChild(s);
}());
