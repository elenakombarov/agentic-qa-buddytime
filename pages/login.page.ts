import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';

export class LoginPage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly logInButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Welcome back' });
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.logInButton = page.getByRole('button', { name: 'Log in', exact: true });
    this.signUpLink = page.getByRole('link', { name: 'Sign up', exact: true });
    this.forgotPasswordLink = page.getByRole('link', {
      name: 'Forgot password?',
    });
  }

  /** Opens the log-in screen. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Login);
  }

  /** Enters the account email address. */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /** Enters the account password. */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /** Submits the log-in form. */
  async submit(): Promise<void> {
    await this.logInButton.click();
  }

  /** Opens the sign-up flow from the log-in screen. */
  async openSignUp(): Promise<void> {
    await this.signUpLink.click();
  }

  /** Opens the forgot-password flow. */
  async openForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
  }
}
