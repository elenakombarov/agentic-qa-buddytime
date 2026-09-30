import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';

export class ForgotPasswordPage {
  readonly heading: Locator;
  readonly instructions: Locator;
  readonly emailInput: Locator;
  readonly sendResetLinkButton: Locator;
  readonly backToLogInLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Reset your password' });
    this.instructions = page.getByText(
      'Enter your email and we’ll send you a reset link.',
    );
    this.emailInput = page.getByLabel('Email');
    this.sendResetLinkButton = page.getByRole('button', {
      name: 'Send reset link',
    });
    this.backToLogInLink = page.getByRole('link', {
      name: '← Back to log in',
    });
  }

  /** Opens the forgot-password screen. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.ForgotPassword);
  }

  /** Enters the email address for the reset link. */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /** Submits the reset-link request (not used in read-only exploration). */
  async submit(): Promise<void> {
    await this.sendResetLinkButton.click();
  }

  /** Returns to the log-in screen without sending a reset link. */
  async backToLogIn(): Promise<void> {
    await this.backToLogInLink.click();
  }
}
