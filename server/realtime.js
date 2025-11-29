/**
 * OpenAI Realtime API WebSocket Server for Twilio Media Streams
 *
 * This server bridges Twilio's Media Streams with OpenAI's Realtime API
 * using the stored prompt: pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255
 */

import WebSocket, { WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Create WebSocket server
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 Realtime API Server listening on port ${PORT}`);

// Store active sessions
const sessions = new Map();

wss.on('connection', async (twilioWs) => {
  console.log('📞 New Twilio Media Stream connection');

  let streamSid = null;
  let callSid = null;
  let openaiWs = null;
  let sessionData = {
    full_name: null,
    phone: null,
    email: null,
    role: null
  };

  // Handle messages from Twilio
  twilioWs.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);

      switch (msg.event) {
        case 'start':
          streamSid = msg.start.streamSid;
          callSid = msg.start.callSid;
          console.log(`🎬 Stream started: ${streamSid}`);

          // Initialize OpenAI Realtime session
          openaiWs = await initializeOpenAISession(twilioWs, callSid);
          sessions.set(callSid, { twilioWs, openaiWs, sessionData });
          break;

        case 'media':
          // Forward audio from Twilio to OpenAI
          if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
            const audioData = {
              type: 'input_audio_buffer.append',
              audio: msg.media.payload
            };
            openaiWs.send(JSON.stringify(audioData));
          }
          break;

        case 'stop':
          console.log(`🛑 Stream stopped: ${streamSid}`);
          if (openaiWs) {
            openaiWs.close();
          }
          sessions.delete(callSid);
          break;
      }
    } catch (error) {
      console.error('Error processing Twilio message:', error);
    }
  });

  twilioWs.on('close', () => {
    console.log('📴 Twilio connection closed');
    if (openaiWs) {
      openaiWs.close();
    }
    if (callSid) {
      sessions.delete(callSid);
    }
  });
});

/**
 * Initialize OpenAI Realtime API session
 */
async function initializeOpenAISession(twilioWs, callSid) {
  return new Promise((resolve, reject) => {
    // Create WebSocket connection to OpenAI Realtime API
    const openaiWs = new WebSocket(
      'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1'
        }
      }
    );

    openaiWs.on('open', () => {
      console.log('✅ Connected to OpenAI Realtime API');

      // Initialize session with the stored prompt
      const sessionConfig = {
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: '', // Will be populated by prompt reference
          voice: 'alloy',
          input_audio_format: 'g711_ulaw',
          output_audio_format: 'g711_ulaw',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          tools: [
            {
              type: 'function',
              name: 'save_waitlist_entry',
              description: 'Save a new entry to the MasseurMatch early access waitlist',
              parameters: {
                type: 'object',
                properties: {
                  full_name: {
                    type: 'string',
                    description: 'The person\'s full name'
                  },
                  phone: {
                    type: 'string',
                    description: 'The person\'s phone number'
                  },
                  email: {
                    type: 'string',
                    description: 'The person\'s email address'
                  },
                  role: {
                    type: 'string',
                    enum: ['therapist', 'client'],
                    description: 'Whether they are a massage therapist or a client'
                  }
                },
                required: ['full_name', 'phone', 'email', 'role']
              }
            }
          ]
        }
      };

      // Reference the stored prompt
      const promptReference = {
        type: 'session.update',
        session: {
          prompt: {
            id: 'pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255',
            version: '1'
          }
        }
      };

      openaiWs.send(JSON.stringify(sessionConfig));
      openaiWs.send(JSON.stringify(promptReference));

      resolve(openaiWs);
    });

    openaiWs.on('message', async (data) => {
      try {
        const response = JSON.parse(data);

        switch (response.type) {
          case 'response.audio.delta':
            // Forward audio from OpenAI to Twilio
            if (twilioWs.readyState === WebSocket.OPEN) {
              const twilioMessage = {
                event: 'media',
                streamSid: sessions.get(callSid)?.streamSid,
                media: {
                  payload: response.delta
                }
              };
              twilioWs.send(JSON.stringify(twilioMessage));
            }
            break;

          case 'response.function_call_arguments.done':
            // Handle function call - save to waitlist
            if (response.name === 'save_waitlist_entry') {
              const args = JSON.parse(response.arguments);
              await saveToWaitlist(args, callSid);
            }
            break;

          case 'conversation.item.input_audio_transcription.completed':
            console.log('User said:', response.transcript);
            break;

          case 'response.audio_transcript.done':
            console.log('Assistant said:', response.transcript);
            break;

          case 'error':
            console.error('OpenAI Error:', response.error);
            break;
        }
      } catch (error) {
        console.error('Error processing OpenAI message:', error);
      }
    });

    openaiWs.on('error', (error) => {
      console.error('OpenAI WebSocket error:', error);
      reject(error);
    });

    openaiWs.on('close', () => {
      console.log('🔌 Disconnected from OpenAI Realtime API');
    });
  });
}

/**
 * Save collected data to Supabase
 */
async function saveToWaitlist(data, callSid) {
  try {
    console.log('💾 Saving to waitlist:', data);

    const { error } = await supabase
      .from('waitlist')
      .insert([data]);

    if (error) {
      console.error('Supabase error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Successfully saved to waitlist');

    // Store in session for reference
    const session = sessions.get(callSid);
    if (session) {
      session.sessionData = data;
    }

    return {
      success: true,
      message: 'Entry saved successfully'
    };
  } catch (error) {
    console.error('Error saving to waitlist:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Health check endpoint (if deploying to platforms that need it)
import http from 'http';
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', sessions: sessions.size }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(PORT + 1, () => {
  console.log(`🏥 Health check available at http://localhost:${PORT + 1}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Shutting down gracefully...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});
