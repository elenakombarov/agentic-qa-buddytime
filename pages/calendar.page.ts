import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class CalendarPage {
  readonly header: HeaderComponent;
  readonly monthLabel: Locator;
  readonly calendarSubtitle: Locator;
  readonly thisWeekSection: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.monthLabel = page.getByText('September 2026');
    this.calendarSubtitle = page.getByText('Your family calendar');
    this.thisWeekSection = page.getByText('This week');
  }

  /** Opens the family calendar. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Calendar);
  }
}
