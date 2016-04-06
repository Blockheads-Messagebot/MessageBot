/*jshint
	browser:	true,
	devel:		true
*/
if (document.querySelector('script[crossorigin="true"]') === null) {
	alert('Your bookmark to launch the bot needs an update, redirecting you to the update page.');
	location.assign('http://theblockheads.net/forum/showthread.php?20353-The-Message-Bot&p=309090&viewfull=1#post309090');
}

//Overwrite the pollChat function to kill the default chat function
window.pollChat = function() {};

var bot = {};

window.onerror = function(text, file, line, column) {
	if (!bot.devMode && text != 'Script error.') {
		var sc = document.createElement('script');
		sc.src = '//blockheadsfans.com/messagebot/error.php?version= ' + bot.version +
					'&wId=' + encodeURIComponent(window.worldId) +
					'&wName=' + encodeURIComponent(bot.core.worldName) +
					'&text=' + encodeURIComponent(text) +
					'&file=' + encodeURIComponent(file) +
					'&line=' + line +
					'&col=' + (column || 0); //IE 9 won't pass column number
		document.head.appendChild(sc);
	}
};
