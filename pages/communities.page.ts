import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';

export class CommunitiesPage {
  readonly header: HeaderComponent;
  readonly heading: Locator;
  readonly createGroupLink: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.heading = page.getByRole('heading', {
      name: 'Your communities',
      level: 2,
    });
    this.createGroupLink = page.getByRole('link', { name: '+ Create group' });
  }

  /** Opens the communities index. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Communities);
  }

  /** Opens the create-community flow. */
  async openCreateGroup(): Promise<void> {
    await this.createGroupLink.click();
  }

  /** Opens a community the user belongs to by its listing name. */
  async openCommunity(name: string): Promise<void> {
    await this.page.getByRole('link', { name: new RegExp(name) }).click();
  }
}
