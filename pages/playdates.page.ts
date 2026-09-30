import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class PlaydatesPage {
  readonly header: HeaderComponent;
  readonly heading: Locator;
  readonly familyCombobox: Locator;
  readonly sendRequestButton: Locator;
  readonly locationNoteInput: Locator;
  readonly optionalNoteInput: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.heading = page.getByRole('heading', {
      name: 'Find a playdate',
      level: 2,
    });
    this.familyCombobox = page.getByRole('combobox').first();
    this.sendRequestButton = page.getByRole('button', {
      name: 'Send request',
    });
    this.locationNoteInput = page.getByRole('textbox', {
      name: 'Location note, park name, or address',
    });
    this.optionalNoteInput = page.getByRole('textbox', {
      name: 'Optional note',
    });
  }

  /** Opens the playdates hub. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Playdates);
  }

  /** Selects a matched time slot by its full accessible name. */
  async selectMatchedSlot(label: string): Promise<void> {
    await this.page.getByRole('button', { name: label }).click();
  }

  /** Declines a pending request on a named family row. */
  async declinePendingRequest(familyName: string): Promise<void> {
    const row = this.page
      .locator('div')
      .filter({ has: this.page.getByText(familyName, { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'Decline' }) })
      .first();
    await row.getByRole('button', { name: 'Decline' }).click();
  }

  /** Cancels a pending playdate row by family name. */
  async cancelRequest(familyName: string): Promise<void> {
    const row = this.page
      .locator('div')
      .filter({ has: this.page.getByText(familyName, { exact: true }) })
      .first();
    await row.getByRole('button', { name: 'cancel' }).click();
  }
}
