# ElevenLabs Callback Integration Guide

This guide walks through setting up the Zapier → ElevenLabs → Your Backend integration for processing customer decisions and generating follow-up actions.

## 📋 Overview

The system flow:
1. **Zapier webhook** receives call data and decision
2. **Your backend** (`/api/elevenlabs/callback`) processes the data
3. **ElevenLabs Conversational AI** generates contextual responses
4. **Decision handler** routes to email or calendar action
5. **Internal team** receives notification with next steps

## 🔧 Setup Instructions

### Step 1: Deploy Your Backend

Ensure your Vercel backend is running with the callback endpoint:

**Endpoint URL**:
```
https://twilloai.vercel.app/api/elevenlabs/callback
```

Test it works:
```bash
curl https://twilloai.vercel.app/api/elevenlabs/callback
# Should return endpoint info
```

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
ELEVENLABS_API_KEY=your_api_key_from_elevenlabs
ELEVENLABS_AGENT_ID=your_conversational_ai_agent_id
ELEVENLABS_VOICE_ID=your_voice_id_for_sarah
```

### Step 3: Create Zapier Zap

**Trigger**: Webhooks by Zapier (Catch Raw Hook)
1. Go to **zapier.com**
2. Create New Zap
3. Select "Webhooks by Zapier"
4. Choose "Catch Raw Hook"
5. Copy the webhook URL

### Step 4: Configure Zapier Action

**Action**: Webhooks by Zapier (POST)

1. Click "+" to add Action
2. Select "Webhooks by Zapier"
3. Choose "POST"
4. Configure:
   - **URL**: `https://twilloai.vercel.app/api/elevenlabs/callback`
   - **Method**: POST
   - **Headers**: `Content-Type: application/json`
   - **Data**:
     ```json
     {
       "decision": "email",
       "caller_phone": "+1234567890",
       "caller_location": "MINNEAPOLIS, MN",
       "call_duration": "180",
       "ai_output": "{{ ai_output }}",
       "call_status": "completed",
       "timestamp": "{{ timestamp }}"
     }
     ```

### Step 5: Test the Webhook

Send a test POST request:

```bash
curl -X POST https://twilloai.vercel.app/api/elevenlabs/callback \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "email",
    "caller_phone": "+15551234567",
    "caller_location": "MINNEAPOLIS, MN",
    "call_duration": "180",
    "call_status": "completed",
    "timestamp": "'$(date -R)'"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "caller_phone": "+15551234567",
    "decision": "email",
    "location": "MINNEAPOLIS, MN",
    "call_duration": "180",
    "status": "completed",
    "processed_at": "2026-02-12T12:00:00.000Z"
  }
}
```

## 🎯 Decision Types & Actions

### Decision: "email"

When caller selects email follow-up:
- ✉️ Generate professional email template
- 📧 Prepare follow-up message
- 📊 Log to analytics

**Output**:
```json
{
  "type": "email_followup",
  "to": "+15551234567",
  "subject": "Your Brazilian Blessed Cleaning Estimate - Next Steps",
  "body": "HTML email content..."
}
```

### Decision: "calendar"

When caller wants to book appointment:
- 📅 Generate calendar invitation
- ⏰ Suggest available time slots
- 📍 Include location data
- 📊 Log to analytics

**Output**:
```json
{
  "type": "calendar_booking",
  "title": "Brazilian Blessed Cleaning Estimate",
  "suggested_times": [
    {
      "date": "2026-02-17",
      "time_start": "10:00",
      "time_end": "12:00"
    },
    {
      "date": "2026-02-18",
      "time_start": "14:00",
      "time_end": "16:00"
    }
  ]
}
```

### Decision: "unknown" or not provided

Default follow-up:
- 🙏 Thank you message
- 📧 General interest confirmation
- 📊 Log for team review

## 🤖 ElevenLabs Conversational AI Integration

The backend calls ElevenLabs Conversational AI API to generate contextual responses:

```typescript
// Example prompt sent to ElevenLabs
const prompt = `
  A customer from MINNEAPOLIS, MN has requested an email follow-up.
  Call duration: 180 seconds
  Phone: +15551234567
  
  Prepare a professional email response acknowledging their interest 
  in Brazilian Blessed Cleaning services.
`;

// ElevenLabs generates natural response
const response = await elevenLabsAPI.conversationalAI(prompt);
```

## 📊 Payload Reference

### Input from Zapier (POST body)

| Field | Type | Required | Example |
|-------|------|----------|---------|
| decision | string | ❌ | "email" or "calendar" |
| caller_phone | string | ✅ | "+15551234567" |
| caller_location | string | ❌ | "MINNEAPOLIS, MN" |
| call_duration | string | ❌ | "180" |
| ai_output | string | ❌ | "{...AI response...}" |
| call_status | string | ❌ | "completed" |
| timestamp | string | ❌ | "Thu, 01 Feb 2018..." |

### Output from Backend

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "data": {
    "caller_phone": "+15551234567",
    "decision": "email",
    "location": "MINNEAPOLIS, MN",
    "call_duration": "180",
    "status": "completed",
    "elevenlabs_response": "Generated response from AI...",
    "processed_at": "2026-02-12T12:00:00.000Z"
  }
}
```

## 🔍 Monitoring & Debugging

### View Logs

```bash
# Check Vercel logs
vercel logs

# Filter for callback endpoint
vercel logs --filter "elevenlabs-callback"
```

### Check Request/Response

Zapier includes a "Logs" tab showing:
- Request sent to your backend
- Response received
- Any errors

### Common Issues

**Issue**: `ELEVENLABS_API_KEY not configured`
- **Solution**: Add `ELEVENLABS_API_KEY` to `.env`

**Issue**: `ElevenLabs API error: 401`
- **Solution**: Verify API key is valid and not expired

**Issue**: Webhook returns 400 Bad Request
- **Solution**: Check JSON payload matches expected format

**Issue**: No caller_phone in request
- **Solution**: Ensure Zapier is sending `caller_phone` field

## 🚀 Advanced: Custom Integrations

### Send to Slack

Add another Zapier action to post to Slack channel:

```json
{
  "text": "New cleaning estimate request from {{ caller_location }}",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Decision*: {{ decision }}\n*Location*: {{ caller_location }}\n*Duration*: {{ call_duration }}s"
      }
    }
  ]
}
```

### Trigger Email Service

Use Zapier's Gmail/SendGrid action to send actual emails:

```
To: customer@example.com
Subject: Your Brazilian Blessed Cleaning Estimate
Body: {{ elevenlabs_response }}
```

### Create CRM Record

Add to HubSpot/Salesforce with:
- Phone number
- Location
- Decision type
- Call duration
- Timestamp

## 📞 Support

For issues with:
- **ElevenLabs API**: Check [ElevenLabs docs](https://elevenlabs.io/docs)
- **Zapier setup**: Check [Zapier support](https://zapier.com/help)
- **Your backend**: Check Vercel logs or local server output

## ✅ Deployment Checklist

- [ ] Backend deployed to Vercel
- [ ] `/api/elevenlabs/callback` endpoint accessible
- [ ] `ELEVENLABS_API_KEY` in environment
- [ ] `ELEVENLABS_AGENT_ID` configured
- [ ] Zapier Zap created with correct webhook URL
- [ ] Test webhook sent and received successfully
- [ ] Team notification email configured
- [ ] Decision handlers working (email/calendar)
- [ ] Analytics logging active
- [ ] Zapier Zap published to production
