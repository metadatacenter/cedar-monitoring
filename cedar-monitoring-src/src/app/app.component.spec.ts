import {TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {SnotifyModule, SnotifyService, ToastDefaults} from 'ng-alt-snotify';
import {AppComponent} from './app.component';
import {SharedModule} from './modules/shared';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        SnotifyModule,
        SharedModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        SnotifyService,
        {
          provide: 'SnotifyToastConfig',
          useValue: ToastDefaults
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    // The shell has to render: ng-alt-snotify's own component subscribes in
    // ngOnInit and unsubscribes unguarded in ngOnDestroy, so a fixture that is
    // never rendered throws when the TestBed tears it down.
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it(`should have as title 'cedar-monitoring'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.title).toEqual('cedar-monitoring');
  });
});
