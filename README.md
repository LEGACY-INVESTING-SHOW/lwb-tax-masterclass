# LWB Tax Workshop

Static registration page for the Legacy Investing Show live tax strategy workshop with Preston Seo.

The page is deployed through Vercel. `index.html` contains the complete landing page, with testimonial profile images stored under `assets/testimonial-avatars/`.

The registration form posts to a Vercel Serverless Function at `/api/register`, which forwards validated leads to Zapier. Set `ZAPIER_WEBHOOK_URL` in the Vercel project environment before deploying.

## Updating the Webinar Schedule

Update the static `data-ev="full"` text as well as `EVENT_DATE`, `EVENT_DISPLAY`, and `EVENT_DAYTIME` in `index.html`, `future.html`, `tax-strategies.html`, and `taxstrategiesyt.html`. Update the three static date labels in each confirmation file (`confirmation.html` and `taxstrategiesconfirmationyt.html`) too. Search engines and other crawlers can read the HTML before JavaScript runs, so the static dates must match the event settings.

Before pushing, check that the previous date is absent from all six files. After deployment, verify the raw HTML from all six production routes, including the static labels. Update the AddEvent calendar ID separately when supplied.
