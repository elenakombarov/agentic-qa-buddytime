import { type Locator, type Page } from '@playwright/test';

/** Inline avatar picker opened from “Change avatar” on a child row. */
export class ChangeAvatarPanelComponent {
  readonly root: Locator;
  readonly doneButton: Locator;

  constructor(page: Page) {
    this.root = page
      .locator('div')
      .filter({ has: page.getByRole('button', { name: 'done' }) });
    this.doneButton = this.root.getByRole('button', { name: 'done' });
  }

  /** Selects an avatar by its accessible name. */
  async pickAvatar(name: string): Promise<void> {
    await this.root.getByRole('button', { name, exact: true }).click();
  }

  /** Closes the picker without saving a new avatar. */
  async cancel(): Promise<void> {
    await this.doneButton.click();
  }
}
