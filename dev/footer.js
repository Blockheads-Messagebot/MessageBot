/*jshint
	browser: true
*/
/*global
	MessageBot
*/
var bot;

window.onerror = function() {
	if (!bot.devMode) {
		var report = this.core.worldName;
		var report2 = JSON.stringify(arguments);
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/error.php?log=' + encodeURIComponent(report) + '&log2=' + encodeURIComponent(report2);
		document.head.appendChild(sc);
	}
};

bot = MessageBot();
bot.start();
