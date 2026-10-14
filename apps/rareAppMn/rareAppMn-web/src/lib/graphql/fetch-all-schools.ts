import "server-only";

import type { Client, CombinedError } from "@urql/core";
import type { PageInfo } from "./types";

const PAGE_SIZE = 100;
const MAX_PAGES = 50;

interface SchoolPageResult<TItem> {
  schools: { items: TItem[]; pageInfo: PageInfo };
}

export async function fetchAllSchools<TItem>(
  client: Client,
  query: string,
): Promise<{ items: TItem[]; error: CombinedError | null }> {
  const items: TItem[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await client
      .query<SchoolPageResult<TItem>>(query, {
        filter: { limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      })
      .toPromise();
    if (result.error) return { items, error: result.error };
    if (!result.data) break;
    items.push(...result.data.schools.items);
    if (!result.data.schools.pageInfo.hasNextPage) break;
  }
  return { items, error: null };
}
