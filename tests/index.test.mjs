import test from 'node:test';
import assert from 'node:assert/strict';
import { createPdfBookmarks } from '../dist/esm/index.js';

test('builds ordered hierarchical bookmarks and updates destinations', () => {
  const bookmarks = createPdfBookmarks(8);
  bookmarks.add({ id: 'chapter', title: 'Chapter 1', page: 0 });
  bookmarks.add({
    id: 'section',
    title: 'Section A',
    page: 2,
    parentId: 'chapter',
  });
  bookmarks.update('section', { title: 'Overview', page: 3 });
  assert.deepEqual(
    bookmarks.tree()[0].children.map((item) => [item.title, item.page]),
    [['Overview', 3]],
  );
});

test('rejects cycles and restores the original parent after failed moves', () => {
  const bookmarks = createPdfBookmarks(5);
  bookmarks.add({ id: 'a', title: 'A', page: 0 });
  bookmarks.add({ id: 'b', title: 'B', page: 1, parentId: 'a' });
  bookmarks.add({ id: 'c', title: 'C', page: 2, parentId: 'b' });
  assert.throws(() => bookmarks.move('a', 'c'), { code: 'cycle' });
  assert.equal(bookmarks.tree()[0].children[0].id, 'b');
});

test('removes descendants or reparents immediate children', () => {
  const bookmarks = createPdfBookmarks(5);
  bookmarks.add({ id: 'root', title: 'Root', page: 0 });
  bookmarks.add({ id: 'child', title: 'Child', page: 1, parentId: 'root' });
  bookmarks.add({
    id: 'grandchild',
    title: 'Grandchild',
    page: 2,
    parentId: 'child',
  });
  bookmarks.remove('child', false);
  assert.deepEqual(
    bookmarks.tree()[0].children.map((item) => item.id),
    ['grandchild'],
  );
  bookmarks.remove('grandchild');
  assert.equal(bookmarks.tree()[0].children.length, 0);
});

test('enforces valid destinations, depth, and unique ids', () => {
  const bookmarks = createPdfBookmarks(2, 10, 1);
  bookmarks.add({ id: 'root', title: 'Root', page: 0 });
  assert.throws(() => bookmarks.add({ id: 'child', title: 'Child', page: 1, parentId: 'root' }), {
    code: 'limit',
  });
  assert.throws(() => bookmarks.add({ id: 'bad', title: 'Bad', page: 2 }), {
    code: 'invalid',
  });
});
