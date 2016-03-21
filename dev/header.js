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