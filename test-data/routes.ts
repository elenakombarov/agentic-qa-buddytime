/** Relative app paths visited during P7 exploration (Playwright `baseURL` = APP_URL). */
export enum AppRoute {
  Landing = '/',
  Login = '/login',
  SignUp = '/signup',
  ForgotPassword = '/forgot-password',
  Dashboard = '/app',
  Calendar = '/calendar',
  Friends = '/friends',
  Communities = '/communities',
  CommunitiesNew = '/communities/new',
  /** Maple Class — only community detail opened during exploration. */
  CommunityMapleClass = '/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f',
  Availability = '/availability',
  Playdates = '/playdates',
  PlaydatesNew = '/playdates/new',
  Birthdays = '/birthdays',
  Profile = '/profile',
  Admin = '/admin',
}
