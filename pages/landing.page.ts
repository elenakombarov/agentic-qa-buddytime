import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';

export class LandingPage {
  readonly brand: Locator;
  readonly tagline: Locator;
  readonly getStartedLink: Locator;
  readonly logInLink: Locator;
  readonly privacyLink: Locator;
  readonly termsLink: Locator;

  constructor(private readonly page: Page) {
    this.brand = page.getByText('BuddyTime', { exact: true });
    this.tagline = page.getByText(
      "See when your kids' friends are free — and book a playdate in three taps.",
    );
    this.getStartedLink = page.getByRole('link', { name: 'Get started' });
    this.logInLink = page.getByRole('link', { name: 'Log in', exact: true });
    this.privacyLink = page.getByRole('link', { name: 'Privacy' });
    this.termsLink = page.getByRole('link', { name: 'Terms' });
  }

  /** Opens the marketing landing page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Landing);
  }

  /** Follows the primary call-to-action to sign up. */
  async openSignUp(): Promise<void> {
    await this.getStartedLink.click();
  }

  /** Opens the log-in screen from the landing page. */
  async openLogIn(): Promise<void> {
    await this.logInLink.click();
  }
}
