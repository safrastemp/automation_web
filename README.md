# Automation workflow for Angular web apps

This project provides a Playwright-based automation runner that can keep an Angular application session alive and walk through a
 sequence of forms automatically. Customize the selectors and URLs to match your application and the script will take care of th
e rest.

## Features

- Launches Chromium through Playwright with configurable headless/slow-motion settings.
- Logs into your Angular app with credentials stored in environment variables (defaults target `http://192.168.14.111/`).
- Runs a keep-alive job so idle timeouts are not triggered.
- Navigates through a list of declarative steps (go to URLs, wait for selectors, click buttons, fill inputs).
- Optionally loops the navigation steps on a timer so the critical forms stay refreshed.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and adjust any selectors or URLs that differ from your Angular app.

3. Run the automation:

   ```bash
   npm start
   ```

## Configuration

The automation is configured via environment variables or by editing `src/config.ts` directly.

| Variable | Description | Default |
| --- | --- | --- |
| `APP_BASE_URL` | Base URL for your Angular application. | `http://192.168.14.111/` |
| `APP_LOGIN_PATH` | Relative path to the login page. | `/` |
| `APP_USERNAME` | Username used for login. | `dfnadmin` |
| `APP_PASSWORD` | Password used for login. | `123` |
| `APP_USERNAME_SELECTOR` | CSS selector(s) for the username field. Combine multiple selectors with `||` to provide fallbacks. | `input[name="username"]†` |
| `APP_PASSWORD_SELECTOR` | CSS selector(s) for the password field. Combine multiple selectors with `||` to provide fallbacks. | `input[name="password"]†` |
| `APP_SUBMIT_SELECTOR` | CSS selector(s) for the login submit button. Combine multiple selectors with `||` to provide fallbacks. | `button[type="submit"]†` |
| `APP_LOGIN_SUCCESS_SELECTOR` | Optional selector that confirms the login succeeded. | unset |
| `APP_KEEP_ALIVE_INTERVAL_MS` | Interval in milliseconds between keep-alive actions. | `180000` |
| `APP_KEEP_ALIVE_SELECTOR` | Selector used by default keep-alive action. | `body` |
| `APP_FORM_ONE_URL` | URL for the first form to visit after login. | `/feature/forms/first` |
| `APP_FORM_ONE_READY` | Selector that marks the first form as ready. | `form` |
| `APP_FORM_TWO_URL` | URL for the second form to visit. | `/feature/forms/second` |
| `APP_FORM_TWO_READY` | Selector that marks the second form as ready. | `form` |
| `APP_FORM_THREE_URL` | Optional URL for a third form to visit. | unset |
| `APP_FORM_THREE_READY` | Selector that marks the third form as ready. | `form` |
| `APP_NAVIGATION_LOOP_INTERVAL_MS` | Interval in milliseconds to re-run the navigation sequence (0 disables looping). | `0` |
| `APP_HEADLESS` | Set to `false` to run the browser in headed mode. | `false` |
| `APP_SLOWMO` | Milliseconds to slow down Playwright actions. | unset |

† Defaults expand to a list of fallback selectors separated by `||`. For example the username selector defaults to `input[name="username"]||input#username||input[name="userName"]||input[formcontrolname="username"]||input[placeholder*="User"]`.

The navigation sequence is described declaratively in `src/config.ts`. You can add more steps (such as additional form visits, button clicks, or input fills) to fit your workflow.

## Environment file template

```
APP_BASE_URL=http://192.168.14.111/
APP_LOGIN_PATH=/
APP_USERNAME=dfnadmin
APP_PASSWORD=123
APP_USERNAME_SELECTOR=input[name="username"]||input#username||input[name="userName"]||input[formcontrolname="username"]||input[placeholder*="User"]
APP_PASSWORD_SELECTOR=input[name="password"]||input#password||input[type="password"]||input[formcontrolname="password"]
APP_SUBMIT_SELECTOR=button[type="submit"]||button:has-text("Login")||button:has-text("Sign In")||input[type="submit"]
APP_LOGIN_SUCCESS_SELECTOR=
APP_KEEP_ALIVE_INTERVAL_MS=180000
APP_KEEP_ALIVE_SELECTOR=body
APP_FORM_ONE_URL=/feature/forms/first
APP_FORM_ONE_READY=form
APP_FORM_TWO_URL=/feature/forms/second
APP_FORM_TWO_READY=form
APP_FORM_THREE_URL=
APP_FORM_THREE_READY=
APP_NAVIGATION_LOOP_INTERVAL_MS=0
APP_HEADLESS=false
APP_SLOWMO=
DEBUG=
```

Save this as `.env` (do not commit secrets to version control). If your application uses different routes or selectors, update t
he corresponding values. Setting `APP_NAVIGATION_LOOP_INTERVAL_MS` to a positive value (for example `600000` for ten minutes) wil
l continuously revisit the configured forms to keep them alive.

## Extending the workflow

- Add or remove navigation steps inside the `navigationSteps` array in `src/config.ts`.
- Introduce more complex actions by editing `performStep` in `src/automation.ts`.
- Replace the keep-alive action with a specific API call or DOM event if your app expects it.
- Provide a selector in `APP_LOGIN_SUCCESS_SELECTOR` to assert that the dashboard (or another known element) is visible after lo
gin.

## Troubleshooting

- Ensure Playwright browsers are installed with `npx playwright install` if you run into missing browser errors.
- Enable headed mode (`APP_HEADLESS=false`) to watch the automation and tweak selectors.
- Increase `APP_SLOWMO` for better visual debugging.
- Set `DEBUG=true` when running `npm start` to print which selectors were used during login.
- If the session is still timing out, shorten `APP_KEEP_ALIVE_INTERVAL_MS` or enable the navigation loop to revisit key pages more frequently.
