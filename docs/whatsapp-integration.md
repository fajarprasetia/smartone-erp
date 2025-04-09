# WhatsApp Integration for SmartOne ERP

This document provides instructions for setting up the WhatsApp Business API integration with SmartOne ERP to enable your team to send and receive WhatsApp messages, create message templates, and track message statuses.

## Prerequisites

1. A Facebook Business Manager account
2. A verified WhatsApp Business Account
3. A phone number registered with WhatsApp Business API
4. API access credentials from WhatsApp Business API

## Step 1: Create a WhatsApp Business API Account

1. Go to [Facebook Business Manager](https://business.facebook.com/) and log in to your account.
2. Navigate to the "Business Settings" > "Accounts" > "WhatsApp accounts" section.
3. Click "Add" to create a new WhatsApp Business account.
4. Follow the wizard to verify your business and register a phone number.

## Step 2: Get WhatsApp API Credentials

1. In Business Manager, navigate to your WhatsApp Business Account.
2. Go to the "API Setup" tab.
3. Make note of the following information:
   - Phone Number ID
   - WhatsApp Business Account ID
   - Temporary Access Token (or create a system user for permanent access)

## Step 3: Configure SmartOne ERP

1. Log in to your SmartOne ERP system as an Administrator or System Administrator.
2. Navigate to "Settings" > "WhatsApp" in the sidebar menu.
3. In the "API Configuration" tab, enter the following information:
   - API Key (if applicable)
   - Phone Number ID
   - Business Account ID
   - Access Token
   - Webhook Verify Token (create your own secure token or use the default)
4. Click "Save Configuration" to store your settings.
5. Click "Test Connection" to verify that the integration is working correctly.

## Step 4: Configure Webhooks in WhatsApp Business API

1. In Business Manager, navigate to your WhatsApp Business Account.
2. Go to the "API Setup" > "Webhooks" tab.
3. Click "Edit" or "Configure Webhooks."
4. Enter the Callback URL from your SmartOne ERP system:
   - URL: `https://your-domain.com/api/webhook/whatsapp`
   - Verify Token: The token you set in SmartOne ERP
5. Select the following webhook fields:
   - messages
   - message_status_updates
   - messaging_referrals
6. Click "Verify and Save."

## Using WhatsApp in SmartOne ERP

### Sending Messages

1. Navigate to "Marketing" > "WhatsApp Chat" in the sidebar menu.
2. Select a contact from the list or search for a specific contact.
3. Type your message in the input field and click the send button.

### Creating Templates

1. Navigate to "Marketing" > "WhatsApp" > "Templates" in the sidebar menu.
2. Click "Create Template" to create a new message template.
3. Fill in the template details:
   - Template Name
   - Category
   - Language
   - Header (optional)
   - Body text
   - Footer (optional)
   - Buttons (optional)
4. Click "Submit for Review" to send the template for WhatsApp approval.

### Tracking Messages

1. Navigate to "Marketing" > "WhatsApp" in the sidebar menu.
2. The dashboard displays statistics about sent messages, delivery rates, and engagement.
3. You can filter the data by date range, template, or contact.

## Troubleshooting

### Webhook Verification Failed

1. Ensure that the Verify Token in SmartOne ERP matches the one you entered in WhatsApp Business API.
2. Verify that your server is accessible from the internet.
3. Check your server's firewall settings to ensure it allows incoming requests from WhatsApp servers.

### Messages Not Being Received

1. Check if your WhatsApp account has been approved for the relevant message template.
2. Verify that the phone number is correctly formatted with the country code.
3. Check the webhook logs in Facebook Business Manager to see if the messages are being sent.

### API Connection Failed

1. Verify that your access token is valid and has not expired.
2. Check if your WhatsApp Business Account is active and in good standing.
3. Ensure that your server can make outbound connections to the WhatsApp API endpoints.

## Support

For additional support with your WhatsApp Business API integration, please contact your SmartOne ERP administrator or WhatsApp Business support. 