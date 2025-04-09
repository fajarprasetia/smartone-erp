# WhatsApp Webhook Setup Tutorial Script

## Introduction (00:00 - 00:30)

Hello and welcome to this tutorial on setting up webhooks for WhatsApp Business API integration with SmartOne ERP. My name is [Presenter Name], and today I'll guide you through the process of configuring webhooks to receive incoming messages and status updates from WhatsApp.

## Prerequisites (00:30 - 01:00)

Before we begin, make sure you have:
- Access to your SmartOne ERP system with administrator privileges
- A WhatsApp Business API account set up in Facebook Business Manager
- Your website accessible via HTTPS (required for webhook security)

## What are Webhooks? (01:00 - 01:30)

Webhooks are automated messages sent from WhatsApp servers to your SmartOne ERP application when certain events occur, such as:
- Receiving a new message from a customer
- Status updates on messages you've sent (delivered, read, failed)
- Message template approvals or rejections

## Step 1: Configure SmartOne ERP Settings (01:30 - 03:00)

1. Log in to your SmartOne ERP system
2. Navigate to Settings > WhatsApp in the sidebar
3. Click on the "Webhook Setup" tab
4. Note the following information:
   - Webhook URL: This is the URL you'll provide to WhatsApp
   - Verify Token: This is a security token that helps verify webhook requests

Feel free to copy these values using the copy buttons provided. You'll need them in the next step.

## Step 2: Configure Webhooks in Facebook Business Manager (03:00 - 05:00)

1. Log in to [Facebook Business Manager](https://business.facebook.com/)
2. Navigate to your WhatsApp Business Account
3. Go to API Setup > Webhooks
4. Click "Configure Webhooks" or "Edit" if already configured
5. Enter the Callback URL from SmartOne ERP
6. Enter the Verify Token exactly as shown in SmartOne ERP
7. Select the following fields to subscribe to:
   - messages
   - message_status_updates
   - messaging_referrals
8. Click "Verify and Save"

## Step 3: Test the Webhook Connection (05:00 - 06:30)

1. After saving, Facebook will send a verification request to your SmartOne ERP system
2. If the verification is successful, you'll see a green checkmark in Facebook
3. To test the connection:
   - Send a test message from another WhatsApp number to your business number
   - Check the WhatsApp chat section in SmartOne ERP to see if the message appears
   - If using a development environment, check your server logs for webhook events

## Troubleshooting Common Issues (06:30 - 08:00)

If you encounter issues with webhook verification:

1. Verify that your SmartOne ERP is accessible via HTTPS
2. Double-check that the Verify Token matches exactly in both systems
3. Ensure your server allows incoming connections from Facebook's IP addresses
4. Check server logs for any error messages during the verification attempt
5. If using a proxy or firewall, ensure it's configured to allow webhook requests

## Best Practices for Webhook Security (08:00 - 09:00)

To ensure your webhook implementation is secure:

1. Use a strong, unique Verify Token
2. Keep your webhook URL confidential
3. Validate all incoming webhook requests
4. Implement rate limiting to prevent abuse
5. Store sensitive information like access tokens securely

## Conclusion (09:00 - 09:30)

Congratulations! You've successfully set up webhooks for your WhatsApp Business API integration with SmartOne ERP. Now your system will automatically receive and process incoming messages and status updates.

If you need further assistance, please refer to our documentation or contact our support team.

## Next Steps (09:30 - 10:00)

In our next tutorial, we'll show you how to create and manage message templates for automated responses. Thanks for watching, and see you next time! 