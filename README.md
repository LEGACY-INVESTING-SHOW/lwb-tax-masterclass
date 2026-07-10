# LWB Tax Workshop

Static registration page for the Legacy Investing Show live tax strategy workshop with Preston Seo.

The page is deployed through Vercel. `index.html` contains the complete landing page, with testimonial profile images stored under `assets/testimonial-avatars/`.

The registration form posts to a Vercel Serverless Function at `/api/register`, which forwards validated leads to Zapier. Set `ZAPIER_WEBHOOK_URL` in the Vercel project environment before deploying.
