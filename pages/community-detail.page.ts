import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { CommunityAnnouncementFormComponent } from './components/community-announcement-form.component';
import { CommunityGroupEventFormComponent } from './components/community-group-event-form.component';
import { HeaderComponent } from './components/header.component';

export class CommunityDetailPage {
  readonly header: HeaderComponent;
  readonly allCommunitiesLink: Locator;
  readonly inviteFamiliesButton: Locator;
  readonly copyInviteLinkButton: Locator;
  readonly membersTab: Locator;
  readonly eventsTab: Locator;
  readonly announcementsTab: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.allCommunitiesLink = page.getByRole('link', {
      name: '← All communities',
    });
    this.inviteFamiliesButton = page.getByRole('button', {
      name: 'Invite families',
    });
    this.copyInviteLinkButton = page.getByRole('button', {
      name: 'Copy invite link',
    });
    this.membersTab = page.getByRole('tab', { name: 'Members' });
    this.eventsTab = page.getByRole('tab', { name: 'Events' });
    this.announcementsTab = page.getByRole('tab', { name: 'Announcements' });
  }

  /** Opens the Maple Class community visited during exploration. */
  async gotoMapleClass(): Promise<void> {
    await this.page.goto(AppRoute.CommunityMapleClass);
  }

  /** Opens the Events tab and returns the group-event composer. */
  async openEventsTab(): Promise<CommunityGroupEventFormComponent> {
    await this.eventsTab.click();
    return new CommunityGroupEventFormComponent(this.page);
  }

  /** Opens the Announcements tab and returns the announcement composer. */
  async openAnnouncementsTab(): Promise<CommunityAnnouncementFormComponent> {
    await this.announcementsTab.click();
    return new CommunityAnnouncementFormComponent(this.page);
  }

  /** Copies the community invite URL. */
  async copyInviteLink(): Promise<void> {
    await this.copyInviteLinkButton.click();
  }
}
