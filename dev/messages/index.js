const layout = require('../layout');

layout.addTabGroup('Messages', 'messages');

require('./join');
require('./leave');
require('./trigger');
require('./announcements');
