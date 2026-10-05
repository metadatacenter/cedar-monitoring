import {describe, expect, it} from 'vitest';
import {noun} from './noun.pipe';

describe('noun', () => {
  for (const [count, expected] of [[0, 'files'], [1, 'file'], [2, 'files'], [null, 'files'], [undefined, 'files']] as const)
    it(`names ${String(count)} ${expected}`, () => expect(noun(count, 'file')).toBe(expected));
  it('takes an irregular plural', () => {
    expect(noun(1, 'entry', 'entries')).toBe('entry');
    expect(noun(3, 'entry', 'entries')).toBe('entries');
  });
});
