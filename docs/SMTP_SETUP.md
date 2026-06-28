# Supabase Custom SMTP Setup Guide

By default, Supabase projects use a built-in email service with a very low rate limit (3 emails per hour) and poor deliverability. To ensure reliable email verification, you should set up a custom SMTP provider (such as Resend, Zoho, or SendGrid) in your Supabase Dashboard.

Follow the instructions below for your chosen provider.

---

## 1. Get SMTP Credentials from your Provider

### Resend
1. Sign in to your [Resend Dashboard](https://resend.com).
2. Go to **Domains** and verify your custom domain.
3. Go to **API Keys** and create a new API Key with "Sending" permissions.
4. Your SMTP settings will be:
   - **SMTP Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: `resend`
   - **Password**: *Your Resend API Key*

### Zoho Mail
1. Sign in to your [Zoho Mail Console](https://mailadmin.zoho.com).
2. Ensure you have configured SPF, DKIM, and DMARC for your domain.
3. If you have 2FA enabled, generate an **App Password** from Zoho Account Security.
4. Your SMTP settings will be:
   - **SMTP Host**: `smtp.zoho.com` (or `smtp.zoho.eu` for EU accounts)
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: *Your Zoho email address* (e.g., `noreply@yourdomain.com`)
   - **Password**: *Your Zoho App Password* (or account password if 2FA is disabled)

### SendGrid
1. Sign in to your [SendGrid Dashboard](https://sendgrid.com).
2. Go to **Settings** -> **Sender Authentication** and complete Domain Authentication.
3. Go to **Settings** -> **API Keys** and create an API Key with "Mail Send" access.
4. Your SMTP settings will be:
   - **SMTP Host**: `smtp.sendgrid.net`
   - **Port**: `465` (SSL) or `587` (TLS)
   - **Username**: `apikey`
   - **Password**: *Your SendGrid API Key*

---

## 2. Configure SMTP in Supabase

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left sidebar, navigate to **Project Settings** -> **Auth**.
4. Scroll down to the **SMTP Settings** section.
5. Toggle **Enable Custom SMTP** to **ON**.
6. Fill in the following fields:
   - **Sender email**: The email address you want to send from (e.g., `noreply@costpilotsai.com`). *Note: This must be a verified sender/domain in your SMTP provider.*
   - **Sender name**: `CostPilot AI` (or your preferred display name).
   - **SMTP Host**: (Enter the host from Step 1, e.g., `smtp.resend.com`).
   - **Port**: `465` (or `587`).
   - **Username**: (Enter the username from Step 1, e.g., `resend` or `apikey`).
   - **Password**: (Enter the API Key or App Password from Step 1).
7. Click **Save** at the bottom of the page.

---

## 3. Verify the Configuration

Once configured, any signup or password reset request will route through your custom SMTP provider.
You can monitor email delivery logs in your SMTP provider's dashboard to confirm that emails are being sent and received successfully.
