import { type Locator, type Page } from '@playwright/test';

/** “New announcement” composer on a community’s Announcements tab. */
export class CommunityAnnouncementFormComponent {
  readonly root: Locator;
  readonly messageInput: Locator;
  readonly postButton: Locator;

  constructor(page: Page) {
    this.root = page.locator('div').filter({ has: page.getByText('New announcement') });
    this.messageInput = this.root.getByRole('textbox', {
      name: 'Share an update with every family in the group…',
    });
    this.postButton = this.root.getByRole('button', {
      name: 'Post announcement',
    });
  }

  /** Enters announcement body text. */
  async fillMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
  }

  /** Posts the announcement (not used in read-only exploration). */
  async submit(): Promise<void> {
    await this.postButton.click();
  }
}
