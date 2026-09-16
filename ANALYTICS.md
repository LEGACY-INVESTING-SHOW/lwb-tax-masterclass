# Legacy Wealth Blueprint Webinar analytics

## Page inventory

Audited September 16, 2026 after pulling `main` to `4ce4ffe` from `LEGACY-INVESTING-SHOW/lwb-tax-masterclass`.

Production site: https://join.managemoney101.com. Vercel project: `lwb-tax-masterclass` (`prj_pi5KZAQqWI8CvN5fRPDeCttFVyPy`).

All seven friendly routes returned HTTP 200 during the audit. The existing production deployment was Ready. These checks establish current availability, not deployment of the new analytics.

| Public path | Source | Purpose | Maintenance evidence |
| --- | --- | --- | --- |
| `/taxseasonisnow` (also `/`) | `index.html` | Webinar registration | Recurring webinar-date updates through September 16 |
| `/future` | `future.html` | Registration variant | Same recurring updates |
| `/tax-strategies` | `tax-strategies.html` | Registration variant | Same recurring updates |
| `/tax-strategies-yt` | `taxstrategiesyt.html` | YouTube registration variant | Added August 25; recurring updates since |
| `/taxseasonconfirmation` | `confirmation.html` | Standard confirmation, videos and calendar | Recurring calendar-ID updates through September 16 |
| `/taxstrategiesconfirmationyt` | `taxstrategiesconfirmationyt.html` | YouTube confirmation, videos and calendar | Added August 25; recurring calendar updates since |
| `/lwbfoundations` | `lwbfoundations.html` | Foundations offer and Whop checkout | Last changed July 17; current traffic unknown |

The recent webinar pages change every two to three days. The eight-week review found 24 webinar-date commits. This proves active maintenance, not paid traffic, spend, visitor counts, or winning creative. Actual pageviews and campaign attribution will establish which pages receive traffic after tracking is deployed. Historical traffic cannot be reconstructed from the new installation.

The first three registration variants post to `/api/register` and redirect to `/taxseasonconfirmation`; the YouTube variant redirects to `/taxstrategiesconfirmationyt`. An accepted API response means the lead was forwarded successfully to Zapier, not that a person attended the webinar or purchased. Confirmation-page visits must remain separate from accepted registrations.

## Project setup status

Both funnels use the existing LIS PostHog project `600066` (Default project). On September 16, the user chose this shared-project arrangement to avoid adding billing details. No additional project or paid subscription is needed.

Every webinar event has `funnel=legacy_wealth_blueprint_webinar`; October events have `funnel=october_2026_challenge`. Separate dashboards and replay views use these event properties. Heatmaps use each funnel's distinct page URLs. The webinar SDK uses its own browser-storage name and only activates on `join.managemoney101.com`.

Billing was checked: `billing_plan=free`, `subscription_level=free`, `has_active_subscription=false`, `customer_id=null`. No billing settings were changed. Both funnels share the monthly free allowance of 1 million analytics events and 5,000 web session recordings; free usage is not unlimited. See [PostHog pricing](https://posthog.com/pricing).

## Measurement plan

- Traffic by canonical page, actual served path, source, medium, campaign, content, device, and referrer.
- Registration CTA clicks, modal opens, form starts, validation failures, submits, accepted registrations, and request failures.
- Scroll milestones and section views.
- Confirmation views, calendar clicks, outbound links, and Vimeo playback progress.
- Foundations checkout views and embed availability, separately labeled from webinar registration. Embedded checkout purchases require a Whop integration; a checkout view is not a sale.
- PostHog autocapture, click/scroll heatmaps, dead clicks, session replay, browser errors, and performance metrics where supported.

Names, emails, phone numbers, and form values must not be sent to PostHog. Mask inputs in replay, block checkout/iframe contents, and strip non-attribution URL query values. Preserve the existing registration, Meta, Kit, Clarity, calendar, and checkout behavior.

## PostHog views

- Webinar dashboard: https://us.posthog.com/project/600066/dashboard/2103328
- October dashboard: https://us.posthog.com/project/600066/dashboard/2094096
- Webinar replay view: https://us.posthog.com/project/600066/replay/playlists/jsDHTRKP
- October replay view: https://us.posthog.com/project/600066/replay/playlists/2xIdzhrt
- Heatmaps: https://us.posthog.com/project/600066/heatmaps

The webinar dashboard contains nine tiles, including an ordered registration funnel. Every tile has an exact webinar funnel filter and `is_test=false`. October retains its four existing tiles, all filtered to `october_2026_challenge`; the previously unfiltered key-actions tile was corrected.

Webinar reports exclude `is_test=true`. Use `?analytics_test=1` for QA; that flag persists for the browser session. Registration success/failure tests must mock API responses rather than sending fake leads to Zapier.

PostHog references: [heatmaps](https://posthog.com/docs/toolbar/heatmaps), [replay privacy](https://posthog.com/docs/session-replay/privacy).

`analytics-posthog-setup.json` documents the webinar dashboard and heatmap definitions. Each webinar insight must retain the funnel filter when edited. A registration-actions trend compares event counts; the ordered registration funnel measures completion through its defined sequence.

## Local verification

- JavaScript syntax, both JSON files, and `git diff --check` passed.
- All seven HTML pages contain the tracker exactly once; all four registration forms include success/failure lifecycle hooks.
- A browser test with mocked API responses observed `opened → started → submitted → failed` and `opened → started → submitted → succeeded`. No test lead was sent to Zapier.
- The missing-token state correctly reports `project_token_pending`; the test session is labeled `is_test=true`.
- An attribution test preserved `last_landing_path=/taxseasonisnow` after navigation to the confirmation page with the same campaign parameters.
- The temporary local server and headless browser were stopped.

The shared-project tracker additionally passed a focused real PostHog SDK test for project token, proxy configuration, isolated persistence, built-in pageleave tagging, snapshot preservation, and mocked form events. Deployment and live ingestion checks are recorded below when complete.
