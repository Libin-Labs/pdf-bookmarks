import { createPdfBookmarks } from '@lp-labs/pdf-bookmarks';

const bookmarks = createPdfBookmarks(3, 10, 4);
bookmarks.add({ id: 'a', title: 'Page one', page: 0 });
const total: number = bookmarks.tree().length;
void total;
