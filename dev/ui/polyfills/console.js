//IE doesn't like console.log unless dev tools are open.
if (!window.console) {
    window.console = {};
    window.log = window.log || [];
    console.log = function(...args) {
        window.log.push(args);
    };
}
['info', 'error', 'warn', 'assert'].forEach(method => {
    if (!console[method]) {
        console[method] = console.log;
    }
});
