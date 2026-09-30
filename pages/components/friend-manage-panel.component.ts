import { type Locator, type Page } from '@playwright/test';

/** Safety actions revealed after “manage” on a friend card. */
export class FriendManagePanelComponent {
  readonly root: Locator;
  readonly reportButton: Locator;
  readonly blockButton: Locator;
  readonly removeButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('div')
      .filter({ has: page.getByRole('button', { name: 'report' }) });
    this.reportButton = this.root.getByRole('button', { name: 'report' });
    this.blockButton = this.root.getByRole('button', { name: 'block' });
    this.removeButton = this.root.getByRole('button', { name: 'remove' });
    this.cancelButton = this.root.getByRole('button', { name: 'cancel' });
  }

  /** Dismisses the manage actions without changing the connection. */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
