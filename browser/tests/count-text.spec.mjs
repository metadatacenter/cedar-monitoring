import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

// Monitoring states counts in English it writes into its templates. A count followed by a plural
// noun says "1 files" when the count is one, so every noun after a count goes through `noun`, which
// gives the singular for one. This reads the source, so it fails when a page states a count with a
// fixed plural again.

const SOURCE = new URL('../../cedar-monitoring-src/src/app/', import.meta.url).pathname;
// An expression that counts, as opposed to one that names a server, a table or a path.
const COUNTS = /count|length|total|checks|\bn\b/i;
const VERBS = new Set(['is', 'was', 'has', 'does', 'goes', 'as', 'its', 'this', 'declares']);

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(directory, entry.name))
      : /\.(html|ts)$/.test(entry.name) && !entry.name.endsWith('.spec.ts') ? [join(directory, entry.name)] : []);
}

test('no count is followed by a fixed plural noun', () => {
  const offenders = [];
  for (const file of files(SOURCE)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:\{\{([^}]*)\}\}|\$\{([^}]*)\})\s+([A-Za-z-]+)/g)) {
      const expression = match[1] ?? match[2];
      const word = match[3];
      if (COUNTS.test(expression) && /s$/.test(word) && !VERBS.has(word.toLowerCase()))
        offenders.push(`${file.slice(SOURCE.length)}: ${match[0].replace(/\s+/g, ' ')}`);
    }
  }
  expect(offenders).toEqual([]);
});
