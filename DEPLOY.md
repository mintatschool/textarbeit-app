# Deployment Introduction

This project is configured to be hosted on **Netlify** (Free Tier) with **Search Engine De-indexing** and **Password Protection**.

## Prerequisites
1.  A free [Netlify account](https://app.netlify.com/signup).
2.  Your code pushed to a Git provider (GitHub, GitLab, or Bitbucket).

## Steps to Deploy

### 1. New Site from Git
1.  Log in to Netlify.
2.  Click **"Add new site"** > **"Import an existing project"**.
3.  Select your Git provider (e.g., GitHub).
4.  Authorize Netlify and select your repository (`textarbeit-app`).

### 2. General Settings
Netlify should automatically detect the settings from `netlify.toml`. Verify them:
-   **Build command:** `npm run build`
-   **Publish directory:** `dist`

### 3. Environment Variables (Critical for Password Protection)
Before clicking "Deploy", you must set the environment variables for the password protection to work.

1.  Click on **"Site configuration"** (or during setup "Show advanced").
2.  Go to **"Environment variables"**.
3.  Add the following variables:
    -   Key: `BASIC_AUTH_USER`
        -   Value: `your_desired_username` (e.g., `admin`)
    -   Key: `BASIC_AUTH_PASSWORD`
        -   Value: `your_secure_password`
4.  If you already deployed, you need to go to **Deploys** > **Trigger deploy** > **Deploy site** for the changes to take effect.

### 4. Verify Deployment
1.  Open your Netlify URL (e.g., `https://your-site-name.netlify.app`).
2.  You should be prompted for a username and password.
3.  Enter the credentials you configured.
4.  The app should load effectively.

### 5. Verify Search Engine Blocking
The site is configured to send a `X-Robots-Tag: noindex` header.
1.  Open the site.
2.  Open Developer Tools (F12) > Network tab.
3.  Refresh the page.
4.  Click on the first request (the document).
5.  Look at the "Response Headers". You should see `x-robots-tag: noindex`.
