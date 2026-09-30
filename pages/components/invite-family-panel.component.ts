import { type Locator, type Page } from '@playwright/test';

/** Circle invite link panel shown after “+ Invite a family”. */
export class InviteFamilyPanelComponent {
  readonly root: Locator;
  readonly inviteLinkCode: Locator;
  readonly copyButton: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('div')
      .filter({ has: page.getByText('Circle invite:') });
    this.inviteLinkCode = this.root.getByRole('code');
    this.copyButton = this.root.getByRole('button', { name: 'copy' });
  }

  /** Copies the circle invite URL to the clipboard. */
  async copyInviteLink(): Promise<void> {
    await this.copyButton.click();
  }
}
