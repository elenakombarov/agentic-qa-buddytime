import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class CommunitiesNewPage {
  readonly header: HeaderComponent;
  readonly backLink: Locator;
  readonly groupNameInput: Locator;
  readonly typeCombobox: Locator;
  readonly descriptionInput: Locator;
  readonly childrenGroup: Locator;
  readonly createGroupButton: Locator;
  readonly cancelLink: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.backLink = page.getByRole('link', { name: '← Back to communities' });
    this.groupNameInput = page.getByRole('textbox', { name: 'Group name' });
    this.typeCombobox = page.getByRole('combobox', { name: 'Type' });
    this.descriptionInput = page.getByRole('textbox', {
      name: 'Description (optional)',
    });
    this.childrenGroup = page.getByRole('group', {
      name: 'Which of your children are in this group?',
    });
    this.createGroupButton = page.getByRole('button', {
      name: 'Create group',
    });
    this.cancelLink = page.getByRole('link', { name: 'Cancel', exact: true });
  }

  /** Opens the create-community form. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.CommunitiesNew);
  }

  /** Returns to the communities list without creating a group. */
  async cancel(): Promise<void> {
    await this.cancelLink.click();
  }
}
