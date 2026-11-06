# @lp-labs/pdf-bookmarks

Edits a bounded destination tree of PDF outline/bookmark records, with parent-cycle protection and
explicit subtree removal behavior.

## Install and quick start

```sh
npm install @lp-labs/pdf-bookmarks
```

```js
import { createPdfBookmarks } from '@lp-labs/pdf-bookmarks';

const bookmarks = createPdfBookmarks(20);
bookmarks.add({ id: 'intro', title: 'Introduction', page: 0 });
bookmarks.add({ id: 'setup', title: 'Setup', page: 3, parentId: 'intro' });
bookmarks.update('setup', { page: 4 });
console.log(bookmarks.tree());
```

## API, types, and customization

- `createPdfBookmarks(pageCount, maxBookmarks?, maxDepth?)` returns `PdfBookmarks`; defaults are
  20,000 entries and 64 nested levels. `PdfBookmark` is the recursively returned tree record.
- `add` and `update` use zero-based page destinations; `move(id, parentId?)` reparents; `tree()`
  returns nested roots. `remove(id, true)` deletes a subtree; `remove(id, false)` promotes immediate
  children to the removed entry's parent.
- IDs are unique, titles are capped at 1,000 characters, and destinations must be inside the declared
  page count. `PdfBookmarksError` uses `invalid`, `duplicate`, `not-found`, `cycle`, or `limit`.

## Interoperability and scope

Map the tree to the outline structure supported by your PDF adapter. This package does not encode PDF
destinations or edit document bytes. Child ordering is insertion order; the model is in-memory and
tree snapshots are newly allocated.

ESM, CommonJS, and TypeScript declarations are included. There are no runtime or peer dependencies;
TypeScript and Prettier are development-only.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
