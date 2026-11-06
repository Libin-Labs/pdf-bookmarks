export interface PdfBookmark {
  readonly id: string;
  readonly title: string;
  readonly page: number;
  readonly parentId?: string;
  readonly children: readonly PdfBookmark[];
}

export class PdfBookmarksError extends Error {
  constructor(
    readonly code: 'invalid' | 'duplicate' | 'not-found' | 'cycle' | 'limit',
    message: string,
  ) {
    super(message);
    this.name = 'PdfBookmarksError';
  }
}

interface BookmarkRecord {
  id: string;
  title: string;
  page: number;
  parentId?: string;
}

export class PdfBookmarks {
  private readonly records = new Map<string, BookmarkRecord>();
  constructor(
    readonly pageCount: number,
    readonly maxBookmarks = 20_000,
    readonly maxDepth = 64,
  ) {
    if (
      !Number.isSafeInteger(pageCount) ||
      pageCount < 1 ||
      !Number.isSafeInteger(maxDepth) ||
      maxDepth < 1
    ) {
      throw new PdfBookmarksError(
        'invalid',
        'Page count and maximum depth must be positive integers.',
      );
    }
  }

  add(input: { id: string; title: string; page: number; parentId?: string }): void {
    if (this.records.has(input.id))
      throw new PdfBookmarksError('duplicate', `Bookmark ${input.id} exists.`);
    if (this.records.size >= this.maxBookmarks)
      throw new PdfBookmarksError('limit', 'Bookmark limit reached.');
    this.validateTarget(input.page);
    if (!input.id || input.title.length > 1000)
      throw new PdfBookmarksError('invalid', 'Bookmark id or title is invalid.');
    if (input.parentId !== undefined) this.require(input.parentId);
    const record = { ...input };
    this.records.set(input.id, record);
    try {
      this.assertDepth(input.id);
    } catch (error) {
      this.records.delete(input.id);
      throw error;
    }
  }

  update(id: string, changes: { title?: string; page?: number }): void {
    const record = this.require(id);
    const next = { ...record, ...changes };
    if (next.title.length > 1000)
      throw new PdfBookmarksError('limit', 'Bookmark title is limited to 1,000 characters.');
    this.validateTarget(next.page);
    this.records.set(id, next);
  }

  move(id: string, parentId?: string): void {
    const record = this.require(id);
    if (parentId === id || (parentId !== undefined && this.isAncestor(id, parentId))) {
      throw new PdfBookmarksError(
        'cycle',
        'A bookmark cannot be moved beneath itself or its descendant.',
      );
    }
    if (parentId !== undefined) this.require(parentId);
    const previous = record.parentId;
    if (parentId === undefined) delete record.parentId;
    else record.parentId = parentId;
    try {
      this.assertSubtreeDepth(id);
    } catch (error) {
      if (previous === undefined) delete record.parentId;
      else record.parentId = previous;
      throw error;
    }
  }

  remove(id: string, includeChildren = true): void {
    this.require(id);
    if (includeChildren) {
      for (const child of this.childIds(id)) this.remove(child, true);
    } else {
      const parentId = this.records.get(id)!.parentId;
      for (const childId of this.childIds(id)) {
        const child = this.records.get(childId)!;
        if (parentId === undefined) delete child.parentId;
        else child.parentId = parentId;
      }
    }
    this.records.delete(id);
  }

  tree(): readonly PdfBookmark[] {
    const build = (parentId?: string): PdfBookmark[] =>
      [...this.records.values()]
        .filter((record) => record.parentId === parentId)
        .map((record) => ({
          id: record.id,
          title: record.title,
          page: record.page,
          ...(record.parentId === undefined ? {} : { parentId: record.parentId }),
          children: build(record.id),
        }));
    return build();
  }

  private childIds(id: string): string[] {
    return [...this.records.values()].filter((item) => item.parentId === id).map((item) => item.id);
  }

  private require(id: string): BookmarkRecord {
    const result = this.records.get(id);
    if (!result) throw new PdfBookmarksError('not-found', `Bookmark ${id} was not found.`);
    return result;
  }

  private validateTarget(page: number): void {
    if (!Number.isSafeInteger(page) || page < 0 || page >= this.pageCount)
      throw new PdfBookmarksError('invalid', 'Bookmark destination page is outside the document.');
  }

  private isAncestor(id: string, possibleAncestor: string): boolean {
    let current: string | undefined = possibleAncestor;
    while (current !== undefined) {
      if (current === id) return true;
      current = this.records.get(current)?.parentId;
    }
    return false;
  }

  private assertDepth(id: string): void {
    let depth = 1;
    let current = this.records.get(id)?.parentId;
    while (current !== undefined) {
      depth += 1;
      if (depth > this.maxDepth)
        throw new PdfBookmarksError('limit', `Bookmark depth exceeds ${this.maxDepth}.`);
      current = this.records.get(current)?.parentId;
    }
  }

  private assertSubtreeDepth(id: string, base = 0): void {
    const depth = base + 1;
    if (depth > this.maxDepth)
      throw new PdfBookmarksError('limit', `Bookmark depth exceeds ${this.maxDepth}.`);
    for (const child of this.childIds(id)) this.assertSubtreeDepth(child, depth);
  }
}

export function createPdfBookmarks(
  pageCount: number,
  maxBookmarks?: number,
  maxDepth?: number,
): PdfBookmarks {
  return new PdfBookmarks(pageCount, maxBookmarks, maxDepth);
}
