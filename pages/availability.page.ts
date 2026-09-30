import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class AvailabilityPage {
  readonly header: HeaderComponent;
  readonly heading: Locator;
  readonly weekendAfternoonsButton: Locator;
  readonly addSlotButton: Locator;
  readonly saveAvailabilityButton: Locator;
  readonly addExceptionButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.heading = page.getByRole('heading', {
      name: 'Set your weekly free time',
      level: 2,
    });
    this.weekendAfternoonsButton = page.getByRole('button', {
      name: 'Weekend afternoons',
    });
    this.addSlotButton = page.getByRole('button', { name: '+ Add slot' });
    this.saveAvailabilityButton = page.getByRole('button', {
      name: 'Save availability',
    });
    this.addExceptionButton = page.getByRole('button', {
      name: 'Add exception',
    });
  }

  /** Opens weekly availability. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Availability);
  }

  /** Adds another weekly availability row. */
  async addSlot(): Promise<void> {
    await this.addSlotButton.click();
  }

  /** Applies the quick “weekend afternoons” preset. */
  async applyWeekendAfternoonsPreset(): Promise<void> {
    await this.weekendAfternoonsButton.click();
  }
}
