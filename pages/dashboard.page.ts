import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { ChangeAvatarPanelComponent } from './components/change-avatar-panel.component';
import { HeaderComponent } from './components/header.component';
import { InviteCoparentPanelComponent } from './components/invite-coparent-panel.component';
import { InviteFamilyPanelComponent } from './components/invite-family-panel.component';

export class DashboardPage {
  readonly header: HeaderComponent;
  readonly greetingHeading: Locator;
  readonly findPlaydateLink: Locator;
  readonly inviteFamilyButton: Locator;
  readonly inviteCoparentButton: Locator;
  readonly addChildButton: Locator;
  readonly childFirstNameInput: Locator;
  readonly enablePushRemindersButton: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.greetingHeading = page.getByRole('heading', { level: 2 });
    this.findPlaydateLink = page.getByRole('link', {
      name: 'Find a Playdate',
    });
    this.inviteFamilyButton = page.getByRole('button', {
      name: '+ Invite a family',
    });
    this.inviteCoparentButton = page.getByRole('button', {
      name: 'Invite co-parent',
    });
    this.addChildButton = page.getByRole('button', { name: 'Add child' });
    this.childFirstNameInput = page.getByRole('textbox', {
      name: "Child's first name",
    });
    this.enablePushRemindersButton = page.getByRole('button', {
      name: 'Enable push reminders',
    });
  }

  /** Opens the signed-in home dashboard. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Dashboard);
  }

  /** Starts a new playdate from the dashboard CTA. */
  async openFindPlaydate(): Promise<void> {
    await this.findPlaydateLink.click();
  }

  /** Reveals the trusted-family circle invite panel. */
  async openInviteFamily(): Promise<InviteFamilyPanelComponent> {
    await this.inviteFamilyButton.click();
    return new InviteFamilyPanelComponent(this.page);
  }

  /** Reveals the co-parent invite panel. */
  async openInviteCoparent(): Promise<InviteCoparentPanelComponent> {
    await this.inviteCoparentButton.click();
    return new InviteCoparentPanelComponent(this.page);
  }

  /** Opens the avatar picker for a child on the dashboard. */
  async openChangeAvatar(childName: string): Promise<ChangeAvatarPanelComponent> {
    const row = this.page
      .locator('div')
      .filter({ has: this.page.getByText(childName, { exact: true }) })
      .filter({ has: this.page.getByRole('button', { name: 'Change avatar' }) })
      .first();
    await row.getByRole('button', { name: 'Change avatar' }).click();
    return new ChangeAvatarPanelComponent(this.page);
  }
}
