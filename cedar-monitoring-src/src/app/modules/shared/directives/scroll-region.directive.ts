import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, inject } from '@angular/core';

let labels = 0;

/**
 * A table's scroll container that a keyboard can reach while its table overflows it.
 *
 * A sideways scroll that holds nothing focusable cannot be scrolled without a pointer. While the
 * content overflows, the container takes a place in the tab order and becomes a region named by the
 * heading given, so the shared focus ring shows where it is. A table that fits adds no Tab stop. The
 * check runs again whenever the container, its content or the set of its children changes.
 */
@Directive({ selector: '[cedarScrollRegion]', standalone: true })
export class ScrollRegionDirective implements OnInit, OnDestroy {
  /** The heading or caption that names the table. */
  @Input({ required: true }) cedarScrollRegion!: HTMLElement;

  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  // Created outside Angular, so a resize or a new row does not start change detection.
  private readonly resizes: ResizeObserver;
  private readonly mutations: MutationObserver;

  constructor() {
    [this.resizes, this.mutations] = inject(NgZone).runOutsideAngular(
      () => [new ResizeObserver(() => this.update()), new MutationObserver(() => this.observe())] as const,
    );
  }

  ngOnInit(): void {
    this.mutations.observe(this.host, { childList: true });
    this.observe();
  }

  ngOnDestroy(): void {
    this.resizes.disconnect();
    this.mutations.disconnect();
  }

  /** Watch the container and each of its children, whose sizes decide whether it overflows. */
  private observe(): void {
    this.resizes.disconnect();
    this.resizes.observe(this.host);
    for (const child of Array.from(this.host.children)) this.resizes.observe(child);
    this.update();
  }

  private update(): void {
    const host = this.host;
    if (host.scrollWidth > host.clientWidth || host.scrollHeight > host.clientHeight) {
      const heading = this.cedarScrollRegion;
      heading.id ||= `cedar-scroll-region-label-${++labels}`;
      host.setAttribute('tabindex', '0');
      host.setAttribute('role', 'region');
      host.setAttribute('aria-labelledby', heading.id);
    } else {
      host.removeAttribute('tabindex');
      host.removeAttribute('role');
      host.removeAttribute('aria-labelledby');
    }
  }
}
