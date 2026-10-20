import type { Page } from '@playwright/test';

export class WidgetPage {
  constructor(page: Page) {
    this.heading = page.getByRole('heading', { name: 'Welcome' });
  }
}
