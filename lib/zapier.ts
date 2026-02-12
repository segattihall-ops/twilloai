/**
 * Zapier webhook integration for call data collection
 */

export interface CallData {
  decision?: string; // "email or calendar"
  caller_phone: string; // "+1234567890"
  caller_location?: string; // "MINNEAPOLIS, MN"
  reason?: string; // "Why the AI made this decision"
  call_duration?: string; // "123 seconds"
  call_sid?: string; // Twilio call SID
  timestamp?: string; // ISO 8601 timestamp
  call_status?: string; // "completed", "abandoned", "failed"
}

export interface EstimateData {
  property_address: string;
  phone: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  preferred_date: string;
  preferred_time: string;
  call_sid?: string;
  timestamp?: string;
}

/**
 * Send call analytics data to Zapier webhook
 */
export async function sendCallDataToZapier(data: CallData): Promise<void> {
  const webhookUrl = process.env.ZAPIER_CALL_DATA_WEBHOOK;

  if (!webhookUrl) {
    console.warn("ZAPIER_CALL_DATA_WEBHOOK not configured");
    return;
  }

  try {
    const payload = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Zapier webhook error: ${response.status} ${response.statusText}`);
    } else {
      console.log("✅ Call data sent to Zapier");
    }
  } catch (error) {
    console.error("Error sending call data to Zapier:", error);
  }
}

/**
 * Send estimate booking data to Zapier webhook
 */
export async function sendEstimateToZapier(data: EstimateData): Promise<void> {
  const webhookUrl = process.env.ZAPIER_ESTIMATE_WEBHOOK;

  if (!webhookUrl) {
    console.warn("ZAPIER_ESTIMATE_WEBHOOK not configured");
    return;
  }

  try {
    const payload = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      full_address: data.property_address,
      property_info: `${data.bedrooms} bed, ${data.bathrooms} bath ${data.property_type}`,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Zapier webhook error: ${response.status} ${response.statusText}`);
    } else {
      console.log("✅ Estimate data sent to Zapier");
    }
  } catch (error) {
    console.error("Error sending estimate to Zapier:", error);
  }
}

/**
 * Format call duration from seconds to human-readable format
 */
export function formatCallDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Extract caller location from Twilio caller ID metadata (if available)
 * This would typically come from a reverse phone lookup service
 */
export async function getCallerLocation(phoneNumber: string): Promise<string | undefined> {
  // This is a placeholder - you'd integrate with a service like TrueCaller or similar
  // For now, returning undefined - can be implemented based on your needs
  return undefined;
}
