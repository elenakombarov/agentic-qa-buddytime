import { type Locator, type Page } from '@playwright/test';
import { CommunityTypeLabel } from '../test-data/community.enums';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class CommunitiesNewPage {
  readonly header: HeaderComponent;
  readonly pageTitle: Locator;
  readonly backLink: Locator;
  readonly groupNameInput: Locator;
  readonly typeCombobox: Locator;
  readonly descriptionInput: Locator;
  readonly childrenGroup: Locator;
  readonly childrenVisibilityHint: Locator;
  readonly createGroupButton: Locator;
  readonly cancelLink: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.pageTitle = page.getByText('Create a community', { exact: true });
    this.backLink = page.getByRole('link', { name: '← Back to communities' });
    this.groupNameInput = page.getByRole('textbox', { name: 'Group name' });
    this.typeCombobox = page.getByRole('combobox', { name: 'Type' });
    this.descriptionInput = page.getByRole('textbox', {
      name: 'Description (optional)',
    });
    this.childrenGroup = page.getByRole('group', {
      name: 'Which of your children are in this group?',
    });
    this.childrenVisibilityHint = page.getByText(
      'Only selected children will be visible to members.',
    );
    this.createGroupButton = page.getByRole('button', {
      name: 'Create group',
    });
    this.cancelLink = page.getByRole('link', { name: 'Cancel', exact: true });
  }

  /**
   * Child visibility checkbox on the create form (`firstName` from GET `/api/v1/me`).
   * @param firstName Exact accessible name (child first name on the live form).
   */
  childCheckbox(firstName: string): Locator {
    return this.childrenGroup.getByRole('checkbox', {
      name: firstName,
      exact: true,
    });
  }

  /** Opens the create-community form. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.CommunitiesNew);
  }

  /** Sets **Group name** on the create form. */
  async fillGroupName(value: string): Promise<void> {
    await this.groupNameInput.fill(value);
  }

  /** Clears **Group name**. */
  async clearGroupName(): Promise<void> {
    await this.groupNameInput.clear();
  }

  /**
   * Selects a **Type** option by visible label.
   * @param label Live combobox label (e.g. **School**).
   */
  async selectType(label: CommunityTypeLabel): Promise<void> {
    await this.typeCombobox.selectOption({ label });
  }

  /** Clicks **Create group** without asserting navigation. */
  async submitCreateGroup(): Promise<void> {
    await this.createGroupButton.click();
  }

  /** Uses **← Back to communities**. */
  async goBackToCommunities(): Promise<void> {
    await this.backLink.click();
  }

  /** Returns to the communities list without creating a group. */
  async cancel(): Promise<void> {
    await this.cancelLink.click();
  }
}
