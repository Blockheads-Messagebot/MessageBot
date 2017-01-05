[
    './checkGroup',
    './world',
].forEach(file => {
    Object.assign(module.exports, require(file));
});
