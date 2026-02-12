import { ElevenLabsClient } from "elevenlabs";

const elevenlabsClient = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

/**
 * Convert text to speech using ElevenLabs
 * @param text - The text to convert to speech
 * @returns Audio buffer as MP3
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  try {
    const audio = await elevenlabsClient.generate({
      voice: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM", // Default to professional male voice
      text,
      model_id: "eleven_monolingual_v1",
    });

    // Convert the response to a Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (error) {
    console.error("ElevenLabs text-to-speech error:", error);
    throw error;
  }
}

/**
 * Get all available voices from ElevenLabs
 */
export async function getAvailableVoices() {
  try {
    const voices = await elevenlabsClient.voices.getAll();
    return voices;
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    throw error;
  }
}

/**
 * Stream text to speech for real-time applications
 * @param text - The text to convert to speech
 */
export async function textToSpeechStream(text: string) {
  try {
    const audioStream = await elevenlabsClient.generate({
      voice: process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
      text,
      model_id: "eleven_monolingual_v1",
    });

    return audioStream;
  } catch (error) {
    console.error("ElevenLabs streaming error:", error);
    throw error;
  }
}
