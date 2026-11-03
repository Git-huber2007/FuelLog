import { unwrap } from '../middleware/errors';

const PAGE = 1000; // Supabase returns at most 1000 rows per request

/**
 * Reads every row of a query, a page at a time.
 * The pages must come from a query with a UNIQUE ordering: ties across a page boundary
 * make `.range()` repeat or drop rows.
 */
export async function all<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const batch = unwrap(await page(from, from + PAGE - 1));
    rows.push(...batch);
    if (batch.length < PAGE) return rows;
  }
}
