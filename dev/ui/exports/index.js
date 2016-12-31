var paths = [
    './alert',
    './notify',
    './template',
    './navigation',
    './console'
];

paths.forEach(path => {
    Object.assign(module.exports, require(path));
});
