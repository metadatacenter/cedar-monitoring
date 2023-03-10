import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalSettingsService {

  // keys
  private static LANGUAGE: string = 'language';

  constructor() {
  }

  public setLanguage(language: string) {
    localStorage.setItem(LocalSettingsService.LANGUAGE, language);
  }

  public getLanguage(): string {
    return localStorage.getItem(LocalSettingsService.LANGUAGE) ?? 'en';
  }
}
