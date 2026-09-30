import { type Locator, type Page } from '@playwright/test';

/** Co-parent invite link panel shown after “Invite co-parent”. */
export class InviteCoparentPanelComponent {
  readonly root: Locator;
  readonly inviteLinkCode: Locator;
  readonly copyButton: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('div')
      .filter({ has: page.getByText('Co-parent invite:') });
    this.inviteLinkCode = this.root.getByRole('code');
    this.copyButton = this.root.getByRole('button', { name: 'copy' });
  }

  /** Copies the co-parent invite URL to the clipboard. */
  async copyInviteLink(): Promise<void> {
    await this.copyButton.click();
  }
}
