// The body envelope CEDAR answers a paged listing with (mirrors PagedListResponse). A subclass adds the
// rows under a name of its own.

export interface PageRequest {
  limit: number;
  offset: number;
}

/** Links to neighbouring pages, keyed by relation. A relation with no page is absent. */
export interface PagingLinks {
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
}

export interface PagedList {
  request: PageRequest;
  /** How many rows match. A lower bound when countCapped is true. */
  totalCount: number;
  currentOffset: number;
  /** Present and true when the server stopped counting at a ceiling; there is then no last link. */
  countCapped?: boolean;
  paging: PagingLinks;
}
