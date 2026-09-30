import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class BirthdaysPage {
  readonly header: HeaderComponent;
  readonly createPartySection: Locator;
  readonly whoseBirthdayCombobox: Locator;
  readonly inviteChildrenGroup: Locator;
  readonly partyTitleInput: Locator;
  readonly venueInput: Locator;
  readonly invitationCardGroup: Locator;
  readonly createPartyButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.createPartySection = page.getByText('Create a birthday party');
    this.whoseBirthdayCombobox = page.getByRole('combobox').first();
    this.inviteChildrenGroup = page.getByRole('group', {
      name: 'Invite children',
    });
    this.partyTitleInput = page.getByRole('textbox', { name: 'Party title' });
    this.venueInput = page.getByRole('textbox', {
      name: 'Venue (e.g. our backyard, Chuck E. Cheese…)',
    });
    this.invitationCardGroup = page.getByRole('radiogroup', {
      name: 'Invitation card',
    });
    this.createPartyButton = page.getByRole('button', {
      name: 'Create party',
    });
  }

  /** Opens birthday party planning. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Birthdays);
  }
}
