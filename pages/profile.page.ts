import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class ProfilePage {
  readonly header: HeaderComponent;
  readonly displayNameInput: Locator;
  readonly phoneInput: Locator;
  readonly saveMyDetailsButton: Locator;
  readonly familyNameInput: Locator;
  readonly hostAddressInput: Locator;
  readonly saveFamilyDetailsButton: Locator;
  readonly myAvailabilityButton: Locator;
  readonly privacySafetyButton: Locator;
  readonly notificationsSettingsButton: Locator;
  readonly calendarSyncButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.displayNameInput = page.getByRole('textbox', {
      name: 'Display name (how your circle sees you)',
    });
    this.phoneInput = page.getByRole('textbox', { name: 'Phone (optional)' });
    this.saveMyDetailsButton = page.getByRole('button', {
      name: 'Save my details',
    });
    this.familyNameInput = page.getByRole('textbox', { name: 'Family name' });
    this.hostAddressInput = page.getByRole('textbox', {
      name: 'Host address or meeting note',
    });
    this.saveFamilyDetailsButton = page.getByRole('button', {
      name: 'Save family details',
    });
    this.myAvailabilityButton = page.getByRole('button', {
      name: 'My Availability Weekly slots',
    });
    this.privacySafetyButton = page.getByRole('button', {
      name: 'Privacy & Safety Private mode · circle only',
    });
    this.notificationsSettingsButton = page.getByRole('button', {
      name: 'Notifications Push + email',
    });
    this.calendarSyncButton = page.getByRole('button', {
      name: 'Calendar Sync Add-to-calendar links soon',
    });
  }

  /** Opens account profile and settings. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Profile);
  }

  /** Opens privacy & safety settings (toast-only in current build). */
  async openPrivacySafety(): Promise<void> {
    await this.privacySafetyButton.click();
  }
}
