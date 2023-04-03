import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MicroservicesService {

  // keys
  private static SERVER_NAMES: string[] = [
    'artifact',
    'group',
    'impex',
    'messaging',
    'monitor',
    'openview',
    'repo',
    'resource',
    'schema',
    'submission',
    'terminology',
    'user',
    'valuerecommender',
    'worker'
  ];

  constructor() {
  }

  public getServerNames() {
    return MicroservicesService.SERVER_NAMES;
  }

}
