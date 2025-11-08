import 'dotenv/config';
import { BrowserContext, chromium, Page } from 'playwright';
import { AutomationConfig, AutomationStep, config } from './config';

async function performStep(page: Page, step: AutomationStep, baseUrl: string): Promise<void> {
  switch (step.type) {
    case 'goto':
      await page.goto(step.url.startsWith('http') ? step.url : new URL(step.url, baseUrl).href, {
        waitUntil: 'load'
      });
      break;
    case 'click':
      await page.click(step.selector);
      break;
    case 'fill':
      await page.fill(step.selector, step.value);
      break;
    case 'waitForSelector':
      await page.waitForSelector(step.selector, { state: step.state ?? 'visible' });
      break;
    case 'wait':
      await page.waitForTimeout(step.ms);
      break;
    default:
      step satisfies never;
  }
}

async function keepAlive(context: BrowserContext, cfg: AutomationConfig): Promise<void> {
  if (!cfg.keepAliveIntervalMs || cfg.keepAliveIntervalMs <= 0) {
    return;
  }

  const keepAlivePage = await context.newPage();
  await performStep(keepAlivePage, { type: 'goto', url: cfg.baseUrl }, cfg.baseUrl);
  setInterval(async () => {
    try {
      await performStep(keepAlivePage, cfg.keepAliveAction, cfg.baseUrl);
      await keepAlivePage.evaluate(() => window.dispatchEvent(new Event('mousemove')));
      console.log(`[keep-alive] action executed at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Keep-alive action failed:', error);
    }
  }, cfg.keepAliveIntervalMs);
}

async function login(page: Page, cfg: AutomationConfig): Promise<void> {
  await page.goto(new URL(cfg.loginPath, cfg.baseUrl).href, { waitUntil: 'load' });
  await page.fill(cfg.usernameSelector, cfg.username);
  await page.fill(cfg.passwordSelector, cfg.password);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.click(cfg.submitSelector),
    cfg.loginSuccessSelector ? page.waitForSelector(cfg.loginSuccessSelector, { state: 'visible' }) : Promise.resolve()
  ]);
}

async function navigateForms(page: Page, steps: AutomationStep[], baseUrl: string): Promise<void> {
  for (const step of steps) {
    await performStep(page, step, baseUrl);
  }
}

async function runNavigationLoop(page: Page, cfg: AutomationConfig): Promise<void> {
  await navigateForms(page, cfg.navigationSteps, cfg.baseUrl);

  if (!cfg.navigationLoopIntervalMs || cfg.navigationLoopIntervalMs <= 0) {
    return;
  }

  console.log(
    `Navigation loop enabled. Repeating the configured steps every ${cfg.navigationLoopIntervalMs / 1000} seconds.`
  );

  while (true) {
    await page.waitForTimeout(cfg.navigationLoopIntervalMs);
    try {
      await navigateForms(page, cfg.navigationSteps, cfg.baseUrl);
      console.log(`[navigation] steps completed at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Navigation loop failed:', error);
    }
  }
}

async function runAutomation(cfg: AutomationConfig): Promise<void> {
  const browser = await chromium.launch(cfg.browser);
  const context = await browser.newContext();
  const page = await context.newPage();

  await login(page, cfg);
  console.log('Login successful, starting keep-alive and navigation.');
  await keepAlive(context, cfg);
  await runNavigationLoop(page, cfg);

  console.log('Automation run complete. Leave this process running to keep the session active.');
}

runAutomation(config).catch((error) => {
  console.error('Automation failed:', error);
  process.exitCode = 1;
});
