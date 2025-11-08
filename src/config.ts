import { LaunchOptions } from 'playwright';

export type AutomationStep =
  | { type: 'goto'; url: string }
  | { type: 'click'; selector: string }
  | { type: 'fill'; selector: string; value: string }
  | { type: 'waitForSelector'; selector: string; state?: 'attached' | 'detached' | 'hidden' | 'visible' }
  | { type: 'wait'; ms: number };

export interface AutomationConfig {
  baseUrl: string;
  loginPath: string;
  username: string;
  password: string;
  usernameSelector: string;
  passwordSelector: string;
  submitSelector: string;
  loginSuccessSelector?: string;
  keepAliveIntervalMs: number;
  keepAliveAction: AutomationStep;
  navigationSteps: AutomationStep[];
  navigationLoopIntervalMs: number;
  browser: LaunchOptions;
}

function buildNavigationSteps(baseUrl: string): AutomationStep[] {
  const steps: AutomationStep[] = [
    { type: 'goto', url: process.env.APP_FORM_ONE_URL ?? '/feature/forms/first' },
    { type: 'waitForSelector', selector: process.env.APP_FORM_ONE_READY ?? 'form' },
    { type: 'goto', url: process.env.APP_FORM_TWO_URL ?? '/feature/forms/second' },
    { type: 'waitForSelector', selector: process.env.APP_FORM_TWO_READY ?? 'form' }
  ];

  const thirdFormUrl = process.env.APP_FORM_THREE_URL;
  if (thirdFormUrl && thirdFormUrl.trim().length > 0) {
    steps.push({ type: 'goto', url: thirdFormUrl });
    steps.push({ type: 'waitForSelector', selector: process.env.APP_FORM_THREE_READY ?? 'form' });
  }

  return steps.map((step) => {
    if (step.type !== 'goto') {
      return step;
    }

    const isAbsolute = /^https?:\/\//i.test(step.url);
    return {
      ...step,
      url: isAbsolute ? step.url : new URL(step.url, baseUrl).href
    };
  });
}

function resolveBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() !== 'false';
}

export const config: AutomationConfig = {
  baseUrl: process.env.APP_BASE_URL ?? 'http://192.168.14.111/',
  loginPath: process.env.APP_LOGIN_PATH ?? '/',
  username: process.env.APP_USERNAME ?? 'dfnadmin',
  password: process.env.APP_PASSWORD ?? '123',
  usernameSelector:
    process.env.APP_USERNAME_SELECTOR ??
    'input[name="username"]||input#username||input[name="userName"]||input[formcontrolname="username"]||input[placeholder*="User"]',
  passwordSelector:
    process.env.APP_PASSWORD_SELECTOR ??
    'input[name="password"]||input#password||input[type="password"]||input[formcontrolname="password"]',
  submitSelector:
    process.env.APP_SUBMIT_SELECTOR ??
    'button[type="submit"]||button:has-text("Login")||button:has-text("Sign In")||input[type="submit"]',
  loginSuccessSelector: process.env.APP_LOGIN_SUCCESS_SELECTOR,
  keepAliveIntervalMs: Number(process.env.APP_KEEP_ALIVE_INTERVAL_MS ?? 180000),
  keepAliveAction: {
    type: 'waitForSelector',
    selector: process.env.APP_KEEP_ALIVE_SELECTOR ?? 'body',
    state: 'visible'
  },
  navigationSteps: [],
  navigationLoopIntervalMs: Number(process.env.APP_NAVIGATION_LOOP_INTERVAL_MS ?? 0),
  browser: {
    headless: resolveBoolean(process.env.APP_HEADLESS, false),
    slowMo: process.env.APP_SLOWMO ? Number(process.env.APP_SLOWMO) : undefined
  }
};

config.navigationSteps = buildNavigationSteps(config.baseUrl);
