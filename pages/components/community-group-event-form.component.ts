import { type Locator, type Page } from '@playwright/test';

/** “Create a group event” form on a community’s Events tab. */
export class CommunityGroupEventFormComponent {
  readonly root: Locator;
  readonly titleInput: Locator;
  readonly venueInput: Locator;
  readonly detailsInput: Locator;
  readonly invitationCardGroup: Locator;
  readonly createEventButton: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('div')
      .filter({ has: page.getByText('Create a group event') });
    this.titleInput = this.root.getByRole('textbox', { name: 'Event title' });
    this.venueInput = this.root.getByRole('textbox', {
      name: 'Venue (optional)',
    });
    this.detailsInput = this.root.getByRole('textbox', {
      name: 'Details for families (optional)',
    });
    this.invitationCardGroup = this.root.getByRole('radiogroup', {
      name: 'Invitation card',
    });
    this.createEventButton = this.root.getByRole('button', {
      name: 'Create event',
    });
  }

  /** Fills the event title. */
  async fillTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
  }

  /** Submits a new group event (not used in read-only exploration). */
  async submit(): Promise<void> {
    await this.createEventButton.click();
  }
}
