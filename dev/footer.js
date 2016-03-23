/*jshint
	browser: true
*/
/*global
	MessageBot
*/
var bot;

window.onerror = function() {
	if (!bot.devMode && arguments[0] != 'Script error.') {
		var report = bot.core.worldName;
		var report2 = JSON.stringify(arguments);
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/error.php?log=' + encodeURIComponent(report) + '&log2=' + encodeURIComponent(report2);
		document.head.appendChild(sc);
	}
};

bot = MessageBot();
bot.start();

//Tracking launches.
(function() {
	var s = document.createElement('script');
	s.src = '//blockheadsfans.com/messagebot/launch.php?name=' + encodeURIComponent(bot.core.ownerName) + '&id=' + window.worldId;
	document.head.appendChild(s);
}());
