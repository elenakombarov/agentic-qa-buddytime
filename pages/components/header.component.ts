import { type Locator, type Page } from '@playwright/test';

/** Shared sidebar navigation and top banner on signed-in screens. */
export class HeaderComponent {
  readonly sidebar: Locator;
  readonly brand: Locator;
  readonly locationBadge: Locator;
  readonly navigation: Locator;
  readonly dashboardLink: Locator;
  readonly calendarLink: Locator;
  readonly friendsLink: Locator;
  readonly communitiesLink: Locator;
  readonly availabilityLink: Locator;
  readonly playdatesLink: Locator;
  readonly birthdaysLink: Locator;
  readonly discoverButton: Locator;
  readonly myProfileLink: Locator;
  readonly adminLink: Locator;
  readonly goPremiumButton: Locator;
  readonly banner: Locator;
  readonly notificationsButton: Locator;
  readonly logOutButton: Locator;

  constructor(private readonly page: Page) {
    this.sidebar = page.getByRole('complementary');
    this.brand = this.sidebar.getByText('BuddyTime', { exact: true });
    this.locationBadge = this.sidebar.getByText('📍 Thornhill beta');
    this.navigation = this.sidebar.getByRole('navigation');
    this.dashboardLink = this.navigation.getByRole('link', {
      name: 'Dashboard',
    });
    this.calendarLink = this.navigation.getByRole('link', { name: 'Calendar' });
    this.friendsLink = this.navigation.getByRole('link', { name: 'Friends' });
    this.communitiesLink = this.navigation.getByRole('link', {
      name: 'Communities',
    });
    this.availabilityLink = this.navigation.getByRole('link', {
      name: 'Availability',
    });
    this.playdatesLink = this.navigation.getByRole('link', {
      name: 'Playdates',
    });
    this.birthdaysLink = this.navigation.getByRole('link', {
      name: 'Birthdays',
    });
    this.discoverButton = this.navigation.getByRole('button', {
      name: 'Discover',
      exact: true,
    });
    this.myProfileLink = this.navigation.getByRole('link', {
      name: 'My Profile',
    });
    this.adminLink = this.navigation.getByRole('link', { name: 'Admin' });
    this.goPremiumButton = this.sidebar.getByRole('button', {
      name: /Go Premium/i,
    });
    this.banner = page.getByRole('banner');
    this.notificationsButton = this.banner.getByRole('button', {
      name: 'Notifications',
    });
    this.logOutButton = this.banner.getByRole('button', {
      name: 'Log out',
      exact: true,
    });
  }

  /** Opens the dashboard from the sidebar. */
  async openDashboard(): Promise<void> {
    await this.dashboardLink.click();
  }

  /** Opens the family calendar. */
  async openCalendar(): Promise<void> {
    await this.calendarLink.click();
  }

  /** Opens the friends list. */
  async openFriends(): Promise<void> {
    await this.friendsLink.click();
  }

  /** Opens the communities list. */
  async openCommunities(): Promise<void> {
    await this.communitiesLink.click();
  }

  /** Opens weekly availability. */
  async openAvailability(): Promise<void> {
    await this.availabilityLink.click();
  }

  /** Opens playdate planning. */
  async openPlaydates(): Promise<void> {
    await this.playdatesLink.click();
  }

  /** Opens birthday parties. */
  async openBirthdays(): Promise<void> {
    await this.birthdaysLink.click();
  }

  /** Opens account profile settings. */
  async openMyProfile(): Promise<void> {
    await this.myProfileLink.click();
  }

  /** Opens the admin dashboard. */
  async openAdmin(): Promise<void> {
    await this.adminLink.click();
  }

  /** Opens the notifications feed in the banner. */
  async openNotifications(): Promise<void> {
    await this.notificationsButton.click();
  }

  /** Signs out from the banner control. */
  async logOut(): Promise<void> {
    await this.logOutButton.click();
  }

  /** Opens the Discover placeholder action. */
  async openDiscover(): Promise<void> {
    await this.discoverButton.click();
  }

  /** Opens the Go Premium placeholder action. */
  async openGoPremium(): Promise<void> {
    await this.goPremiumButton.click();
  }
}
