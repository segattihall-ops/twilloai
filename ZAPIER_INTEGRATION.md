# Zapier Integration Guide

This system collects call data and sends it to Zapier webhooks for automation, logging, and CRM integration.

## Overview

Two types of data are sent to Zapier:

### 1. Call Analytics Data
Sent when a call ends to track overall call performance and outcomes.

**Webhook URL**: `ZAPIER_CALL_DATA_WEBHOOK`

**Data Structure**:
```json
{
  "decision": "estimate_booked OR no_estimate",
  "caller_phone": "+1234567890",
  "call_duration": "123 seconds",
  "reason": "Why the AI made this decision",
  "call_sid": "CA1234567890abcdef",
  "timestamp": "2026-02-12T12:00:00.000Z",
  "call_status": "completed"
}
```

### 2. Estimate Booking Data
Sent when a client successfully schedules an in-person estimate.

**Webhook URL**: `ZAPIER_ESTIMATE_WEBHOOK`

**Data Structure**:
```json
{
  "property_address": "123 Main St, Minneapolis, MN",
  "phone": "+1234567890",
  "property_type": "house",
  "bedrooms": 3,
  "bathrooms": 2,
  "preferred_date": "Tuesday",
  "preferred_time": "10 AM to 12 PM",
  "call_sid": "CA1234567890abcdef",
  "call_duration_seconds": 180,
  "timestamp": "2026-02-12T12:00:00.000Z"
}
```

## Setup Instructions

### Step 1: Create Zapier Zap

1. Go to [zapier.com](https://zapier.com)
2. Create a new Zap
3. Choose **Webhooks by Zapier** as the trigger (Catch Raw Hook)
4. Copy the webhook URL provided by Zapier

### Step 2: Set Environment Variables

Add these to your `.env` file:

```env
ZAPIER_CALL_DATA_WEBHOOK=https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID_1/
ZAPIER_ESTIMATE_WEBHOOK=https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID_2/
```

### Step 3: Configure Zapier Actions

Configure what happens with the data. Common actions:

- **Save to Google Sheets**: Log all calls and estimates
- **Create CRM Records**: Add to HubSpot, Salesforce, etc.
- **Send Emails**: Notify team of new estimates
- **Create Calendar Events**: Auto-schedule follow-ups
- **Send Slack Notifications**: Alert team in real-time

## Example: Send to Google Sheets

1. In your Zapier Zap, add an action: **Google Sheets → Create Spreadsheet Row**
2. Connect your Google account
3. Select your spreadsheet and worksheet
4. Map the fields:
   - **Date**: `timestamp`
   - **Phone**: `caller_phone`
   - **Decision**: `decision`
   - **Duration**: `call_duration`
   - **Reason**: `reason`

## Testing

Test with cURL:

```bash
# Test call data webhook
curl -X POST YOUR_ZAPIER_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "estimate_booked",
    "caller_phone": "+15551234567",
    "call_duration": "180 seconds",
    "reason": "Client successfully scheduled estimate",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'

# Test estimate webhook
curl -X POST YOUR_ESTIMATE_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "property_address": "234 Oak Ave, Minneapolis, MN",
    "phone": "+15551234567",
    "property_type": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "preferred_date": "Wednesday",
    "preferred_time": "2 PM to 4 PM",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
  }'
```

## Advanced Use Cases

### SMS Notifications
Create a Zap that sends SMS to the team when an estimate is booked.

### Calendar Integration
Auto-create calendar entries for scheduled estimates using the `preferred_date` and `preferred_time`.

### Lead Scoring
Use multiple Zaps to track call patterns and score leads based on estimate booking rates.

### Email Follow-up
Send automated emails to prospects after their call, with personalized messages based on the `decision` field.

## Debugging

Enable debugging with:

```bash
# Check the realtime server logs
docker logs [container-id]
```

If webhooks aren't being sent, verify:
- ✅ `ZAPIER_CALL_DATA_WEBHOOK` and `ZAPIER_ESTIMATE_WEBHOOK` are set in `.env`
- ✅ Webhook URLs are valid and active in Zapier
- ✅ Network connectivity to Zapier is available
- ✅ Call completes successfully (check `call_status` in logs)

## Webhook Retry Policy

Zapier automatically retries failed webhooks. Configure retry behavior in your Zap settings:
- **Immediate Retry**: Failed webhook retries within seconds
- **Delayed Retry**: Retries after minutes/hours if initial fails

## Privacy & Compliance

This integration collects phone numbers and property information. Ensure:
- ✅ GDPR/CCPA compliance if applicable
- ✅ Data retention policies are configured in Zapier
- ✅ Only necessary data is sent to Zapier
