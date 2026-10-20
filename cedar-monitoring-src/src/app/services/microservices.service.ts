import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MicroservicesService {

  // keys
  private static SERVER_NAMES: string[] = [
    'artifact',
    'bridge',
    'group',
    'impex',
    'messaging',
    'monitor',
    'openview',
    'repo',
    'resource',
    'terminology',
    'user',
    'worker'
  ];

  constructor() {
  }

  public getServerNames() {
    return MicroservicesService.SERVER_NAMES;
  }

}
