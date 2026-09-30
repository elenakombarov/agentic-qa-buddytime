import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';

export class SignUpPage {
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signUpButton: Locator;
  readonly logInLink: Locator;
  readonly termsOfServiceLink: Locator;
  readonly privacyPolicyLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Create your account' });
    this.nameInput = page.getByLabel('Your name');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password (8+ characters)');
    this.signUpButton = page.getByRole('button', { name: 'Sign up', exact: true });
    this.logInLink = page.getByRole('link', { name: 'Log in', exact: true });
    this.termsOfServiceLink = page.getByRole('link', {
      name: 'Terms of Service',
    });
    this.privacyPolicyLink = page.getByRole('link', {
      name: 'Privacy Policy',
    });
  }

  /** Opens the sign-up screen. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.SignUp);
  }

  /** Enters the parent or guardian display name. */
  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  /** Enters the account email address. */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /** Enters the new account password. */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /** Submits the sign-up form. */
  async submit(): Promise<void> {
    await this.signUpButton.click();
  }

  /** Returns to the log-in screen without creating an account. */
  async openLogIn(): Promise<void> {
    await this.logInLink.click();
  }
}
