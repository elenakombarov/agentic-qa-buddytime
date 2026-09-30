import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { FriendManagePanelComponent } from './components/friend-manage-panel.component';
import { HeaderComponent } from './components/header.component';
import { InviteFamilyPanelComponent } from './components/invite-family-panel.component';

export class FriendsPage {
  readonly header: HeaderComponent;
  readonly inviteFamilyButton: Locator;
  readonly exploreCommunitiesLink: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.inviteFamilyButton = page.getByRole('button', {
      name: '+ Invite a family',
    });
    this.exploreCommunitiesLink = page.getByRole('link', {
      name: 'Explore Communities',
    });
  }

  /** Opens the friends list. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Friends);
  }

  /** Reveals the circle invite panel. */
  async openInviteFamily(): Promise<InviteFamilyPanelComponent> {
    await this.inviteFamilyButton.click();
    return new InviteFamilyPanelComponent(this.page);
  }

  /** Opens safety actions for a connected family card. */
  async openManage(familyName: string): Promise<FriendManagePanelComponent> {
    const card = this.page
      .locator('div')
      .filter({ has: this.page.getByText(familyName, { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'manage' }) })
      .first();
    await card.getByRole('button', { name: 'manage' }).click();
    return new FriendManagePanelComponent(this.page);
  }

  /** Schedules a playdate with a named family from its card. */
  async schedulePlaydate(familyName: string): Promise<void> {
    const card = this.page
      .locator('div')
      .filter({ has: this.page.getByText(familyName, { exact: true }) })
      .first();
    await card.getByRole('button', { name: 'Schedule Playdate' }).click();
  }
}
