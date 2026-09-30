import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class PlaydatesNewPage {
  readonly header: HeaderComponent;
  readonly heading: Locator;
  readonly sendRequestButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.heading = page.getByRole('heading', {
      name: 'Find a playdate',
      level: 2,
    });
    this.sendRequestButton = page.getByRole('button', {
      name: 'Send request',
    });
  }

  /** Opens the new-playdate route from the dashboard CTA. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.PlaydatesNew);
  }
}
