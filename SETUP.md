# Quick Setup Guide

## 1. Vercel Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

### Twilio Credentials
```
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = your_auth_token_here
TWILIO_PHONE_NUMBER = +1234567890
BRAZILIAN_BLESSED_TEAM_NUMBER = +1234567890
```

### OpenAI API Key
```
OPENAI_API_KEY = sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Supabase Credentials
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: After adding environment variables, redeploy your app!

## 2. Supabase Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create waitlist table
CREATE TABLE waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to insert
CREATE POLICY "Allow service role to insert"
ON waitlist
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy to allow service role to select
CREATE POLICY "Allow service role to select"
ON waitlist
FOR SELECT
TO service_role
USING (true);
```

## 3. Twilio Sync Setup

Create a Twilio Sync Service named "default" with a Map called "callback":

1. Go to Twilio Console → Sync → Services
2. Create a new service named "default"
3. Create a new Sync Map named "callback"

## 4. Configure Twilio Phone Number Webhooks

Update your Twilio phone number webhooks:

### Voice Webhook
```
URL: https://your-app.vercel.app/api/voice
Method: POST
```

### SMS Webhook
```
URL: https://your-app.vercel.app/api/sms/missed-call
Method: POST
```

### Call Status Callback
```
URL: https://your-app.vercel.app/api/sms/missed-call
Method: POST
```

## 5. Test Your Setup

### Test Voice Assistant
1. Call your Twilio phone number
2. Press 1 for AI assistant
3. Say something like "What services do you offer?"
4. The AI should respond intelligently

### Test Waitlist API
```bash
curl -X POST https://your-app.vercel.app/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "role": "customer"
  }'
```

### Test SMS Commands
Send an SMS to your Twilio number with: `CALL`

## 6. Phone Menu Options

When someone calls your number:

- **Press 1**: Talk to AI Assistant (OpenAI GPT-4)
- **Press 2**: Transfer to masseur directly
- **Press 3**: Booking/availability info
- **Press 4**: Pricing info
- **Press 5**: Leave a voicemail

## 7. AI Assistant Capabilities

The AI assistant can:
- Answer questions about services
- Provide pricing information
- Help with booking inquiries
- Transfer to human when needed
- Handle natural conversation flow

## 8. Monitoring & Logs

View logs in Vercel:
```bash
vercel logs https://your-app.vercel.app --follow
```

Or use the Vercel dashboard: Functions → Logs

## Troubleshooting

### OpenAI not working?
- Verify `OPENAI_API_KEY` is set in Vercel
- Check OpenAI API quota/billing
- View logs for error messages

### Twilio webhooks failing?
- Ensure URLs use HTTPS (not HTTP)
- Check webhook URLs in Twilio console
- Verify all environment variables are set

### Supabase connection issues?
- Verify both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase project is not paused
- Verify RLS policies are correct

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase database table created
- [ ] Twilio Sync service configured
- [ ] Twilio webhooks pointing to production URL
- [ ] OpenAI API key has sufficient quota
- [ ] Test all phone menu options
- [ ] Test AI assistant conversation
- [ ] Test waitlist API endpoint
- [ ] Test SMS commands

## Support

- Twilio Console: https://console.twilio.com
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- OpenAI Platform: https://platform.openai.com
