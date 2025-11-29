# Twilio AI Voice Assistant

AI-powered phone system for Knotty massage therapy using Twilio and OpenAI.

## Features

- 🤖 **OpenAI Voice Assistant** - Intelligent conversational AI for customer inquiries
- 📞 **Twilio Integration** - Professional phone system with IVR menu
- 💬 **SMS Handling** - Automated missed call notifications and command processing
- 📋 **Waitlist Management** - Supabase-powered customer waitlist
- 🔄 **Call Transfer** - Seamless transfer to live masseurs
- 📧 **Voicemail System** - Professional voicemail recording and storage

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Voice AI**: OpenAI GPT-4
- **Telephony**: Twilio Voice & SMS
- **Database**: Supabase
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Twilio account with phone number
- OpenAI API key
- Supabase project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/segattihall-ops/twilloai.git
cd twilloai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
MASSEUR_PHONE=+1234567890

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

4. Run the development server:
```bash
npm run dev
```

5. Set up Twilio webhook (using ngrok for local development):
```bash
ngrok http 3000
```

Configure Twilio phone number webhook:
- Voice webhook: `https://your-ngrok-url.ngrok.io/api/voice`
- SMS webhook: `https://your-ngrok-url.ngrok.io/api/sms/missed-call`

## API Routes

### Voice Routes

- `POST /api/voice` - Main IVR menu
- `POST /api/voice/ai-assistant` - OpenAI conversational assistant
- `POST /api/voice/menu` - Menu option handler
- `POST /api/voice/transfer` - Transfer to masseur
- `POST /api/voice/callback` - Return customer call
- `POST /api/voice/voicemail` - Record voicemail
- `POST /api/voice/voicemail-thanks` - Voicemail confirmation

### SMS Routes

- `POST /api/sms/command` - Handle SMS commands (e.g., "CALL")
- `POST /api/sms/missed-call` - Missed call notifications

### Other Routes

- `POST /api/waitlist` - Add to waitlist

## Phone Menu Flow

```
┌─────────────────────────────────────┐
│   Welcome to Knotty                 │
├─────────────────────────────────────┤
│ Press 1: AI Assistant               │
│ Press 2: Speak with Masseur         │
│ Press 3: Booking/Availability       │
│ Press 4: Prices & Info              │
│ Press 5: Leave Voicemail            │
└─────────────────────────────────────┘
```

## AI Assistant Features

The OpenAI voice assistant can:
- Answer questions about services and pricing
- Help with booking inquiries
- Provide information about massage types
- Transfer to live masseur when needed
- Handle natural conversational flow

## Supabase Setup

Create a `waitlist` table:

```sql
CREATE TABLE waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Deployment

### Deploy to Vercel

```bash
vercel deploy --prod
```

### Configure Twilio Webhooks

Update your Twilio phone number webhooks to point to your production URL:
- Voice: `https://your-app.vercel.app/api/voice`
- SMS: `https://your-app.vercel.app/api/sms/missed-call`

### Environment Variables

Add all environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.example`
3. Redeploy

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Support

For support, email support@knotty.com or open an issue on GitHub.
