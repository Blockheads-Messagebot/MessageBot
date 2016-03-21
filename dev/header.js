/*jshint
	browser:	true,
	devel:		true
*/
/*global
	bot
*/
if (document.querySelector('script[crossorigin="true"]') === null) {
	alert('Your bookmark to launch the bot needs an update, redirecting you to the update page.');
	location.assign('http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=309090&viewfull=1#post309090');
}

window.onerror = function() {
	if (!bot.devMode) {
		var report = this.core.worldName;
		var report2 = JSON.stringify(arguments);
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/error.php?log=' + encodeURIComponent(report) + '&log2=' + encodeURIComponent(report2);
		document.head.appendChild(sc);
	}
};

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {}; 