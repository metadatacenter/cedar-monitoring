import {Pipe, PipeTransform} from '@angular/core';

/**
 * The noun for a count: its singular for exactly one, its plural for any other number. Every
 * count Monitoring states goes through this, so a page cannot say "1 files" again.
 */
export function noun(count: number | null | undefined, singular: string, plural = `${singular}s`): string {
  return count === 1 ? singular : plural;
}

/** `{{ n }} {{ n | noun: 'file' }}`, or `{{ n | noun: 'entry' : 'entries' }}` for an irregular plural. */
@Pipe({name: 'noun'})
export class NounPipe implements PipeTransform {
  transform(count: number | null | undefined, singular: string, plural?: string): string {
    return noun(count, singular, plural);
  }
}
