import {Component, Input} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {MatIconModule} from '@angular/material/icon';
import {iconNames, getIcon} from '@org.metadatacenter/cedar-design-tokens/icons';
import {CedarIconDirective} from './cedar-icon.directive';

@Component({standalone: true, imports: [MatIconModule, CedarIconDirective], template: '<button aria-label="Action"><mat-icon [cedarIcon]="name"></mat-icon></button>'})
class IconHost { @Input() name = 'info'; }

describe('Shared CEDAR icon rendering', () => {
  beforeEach(() => TestBed.configureTestingModule({imports: [IconHost], providers: [provideHttpClient()]}));
  for (const name of iconNames) {
    it('renders safe shared geometry for ' + name, () => {
      const fixture = TestBed.createComponent(IconHost);
      fixture.componentInstance.name = name;
      fixture.detectChanges();
      const host = fixture.nativeElement.querySelector('mat-icon');
      const svg = host.querySelector('svg');
      expect(svg).withContext(name).not.toBeNull();
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg.getAttribute('stroke-width')).toBe('2');
      expect(host.getAttribute('aria-hidden')).toBe('true');
      expect(host.textContent.trim()).toBe('');
      expect(svg.querySelector('script, foreignObject, image')).toBeNull();
      const expected = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      expected.innerHTML = getIcon(name).body;
      expect(svg.innerHTML).toBe(expected.innerHTML);
      expect(host.getBoundingClientRect().width).toBe(20);
      expect(host.getBoundingClientRect().height).toBe(20);
    });
  }
  it('switches geometry when an action changes', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    fixture.componentRef.setInput('name', 'delete');
    fixture.detectChanges();
    const expected = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    expected.innerHTML = getIcon('delete').body;
    expect(fixture.nativeElement.querySelector('svg').innerHTML).toBe(expected.innerHTML);
  });
  it('rejects unknown names rather than rendering ligatures or supplied SVG', () => {
    const fixture = TestBed.createComponent(IconHost);
    fixture.componentInstance.name = '<svg onload="bad()">';
    expect(() => fixture.detectChanges()).toThrowError(/Unknown CEDAR icon/);
  });
});
