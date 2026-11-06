import { createPdfBookmarks, type PdfBookmark } from '@lp-labs/pdf-bookmarks';

const bookmarks = createPdfBookmarks(4);
bookmarks.add({ id: 'start', title: 'Start', page: 0 });
const roots: readonly PdfBookmark[] = bookmarks.tree();
void roots;
