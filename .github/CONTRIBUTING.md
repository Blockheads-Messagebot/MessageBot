### Most importantly

Please do! Any and all help is welcome, even if all you do is file an issue which helps me fix a bug.

### What branch should I work from?

When a large rewrite is taking place, a branch for the primary feature will be added. This is the branch to work from for adding new features. If are fixing a bug which needs to be released before the large feature is released, work from the `master` branch.

### Pull requests

Please keep pull requests to one bugfix / feature, this makes them easier to review and more likely to be merged in.

#### Code style

- Indent with 4 spaces
- Always use braces for `if`, `for`, `while`, etc. statements.
- Always use semicolons.
- Variables, methods, and properties are `camelCased`, classes and interfaces are `PascalCased`.
- Write JSDoc comments at a minimum for methods accessible to extensions, if the method is not exposed, documenting parameters is optional though a summary of the method is a good idea.
