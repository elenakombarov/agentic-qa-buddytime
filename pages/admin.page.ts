import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class AdminPage {
  readonly header: HeaderComponent;
  readonly asOfSummary: Locator;
  readonly refreshButton: Locator;
  readonly parentsSignedUpMetric: Locator;
  readonly newParentsChart: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.asOfSummary = page.getByText(/As of .* · all families/);
    this.refreshButton = page.getByRole('button', { name: 'Refresh' });
    this.parentsSignedUpMetric = page.getByText('Parents signed up');
    this.newParentsChart = page.getByRole('list', {
      name: 'New parents per week',
    });
  }

  /** Opens the admin analytics dashboard. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Admin);
  }

  /** Reloads admin metrics. */
  async refresh(): Promise<void> {
    await this.refreshButton.click();
  }
}
