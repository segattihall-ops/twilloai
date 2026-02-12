/**
 * Utilities for handling different decision types from Zapier webhook
 */

export interface DecisionData {
  caller_phone: string;
  caller_location: string;
  call_duration: string;
  decision: string;
}

export interface ClientInfo {
  phone: string;
  location?: string;
  estimateAddress?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  preferredDate?: string;
  preferredTime?: string;
}

/**
 * Send email notification to internal team and/or client
 */
export async function sendEmailNotification(
  decision: string,
  clientInfo: ClientInfo,
  callDuration: string
): Promise<boolean> {
  try {
    const subject = `New Client ${decision === "email" ? "Email Request" : "Calendar Request"} - ${clientInfo.location || "Unknown Location"}`;
    const body = `
      <h2>New ${decision === "email" ? "Email" : "Calendar"} Request</h2>
      <p><strong>Phone:</strong> ${clientInfo.phone}</p>
      <p><strong>Location:</strong> ${clientInfo.location || "Not provided"}</p>
      <p><strong>Call Duration:</strong> ${callDuration} seconds</p>
      <p><strong>Client Decision:</strong> Prefers ${decision === "email" ? "email follow-up" : "calendar scheduling"}</p>
      
      ${
        clientInfo.estimateAddress
          ? `
      <h3>Estimate Details:</h3>
      <ul>
        <li><strong>Address:</strong> ${clientInfo.estimateAddress}</li>
        <li><strong>Property Type:</strong> ${clientInfo.propertyType || "N/A"}</li>
        <li><strong>Bedrooms:</strong> ${clientInfo.bedrooms || "N/A"}</li>
        <li><strong>Bathrooms:</strong> ${clientInfo.bathrooms || "N/A"}</li>
        <li><strong>Preferred Date:</strong> ${clientInfo.preferredDate || "N/A"}</li>
        <li><strong>Preferred Time:</strong> ${clientInfo.preferredTime || "N/A"}</li>
      </ul>
      `
          : ""
      }
    `;

    console.log("📧 Email notification:", { subject, body });
    // In production, integrate with email service
    return true;
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

/**
 * Generate calendar invitation data
 */
export function generateCalendarInvitation(
  clientInfo: ClientInfo
): Record<string, any> {
  return {
    title: "Brazilian Blessed Cleaning Estimate",
    description: `
      In-person cleaning estimate for client from ${clientInfo.location}
      
      Property: ${clientInfo.estimateAddress || "To be confirmed"}
      Type: ${clientInfo.propertyType || "Unknown"}
      Size: ${clientInfo.bedrooms || "?"} bed, ${clientInfo.bathrooms || "?"} bath
    `,
    suggested_times: [
      {
        date: getNextTuesday(),
        time_start: "10:00",
        time_end: "12:00",
        timezone: "America/Chicago",
      },
      {
        date: getNextWednesday(),
        time_start: "14:00",
        time_end: "16:00",
        timezone: "America/Chicago",
      },
    ],
    preferred_date: clientInfo.preferredDate,
    preferred_time: clientInfo.preferredTime,
    attendees: [
      {
        email: "team@brazilianblessed.com",
        name: "Brazilian Blessed Cleaning Team",
        role: "organizer",
      },
    ],
    location: clientInfo.estimateAddress || clientInfo.location || "To be confirmed",
    type: "calendar_booking",
    priority: "high",
  };
}

/**
 * Send internal notification to internal team
 */
export async function sendInternalNotification(
  decision: string,
  clientInfo: ClientInfo,
  callDuration: string
): Promise<boolean> {
  try {
    const subject =
      decision === "email"
        ? `📧 Email Follow-up Requested - ${clientInfo.location}`
        : `📅 Calendar Booking Requested - ${clientInfo.location}`;

    const body = `
      <h2>New Decision from Caller</h2>
      <p><strong>Decision Type:</strong> ${decision}</p>
      <p><strong>Caller Phone:</strong> ${clientInfo.phone}</p>
      <p><strong>Location:</strong> ${clientInfo.location || "Not provided"}</p>
      <p><strong>Call Duration:</strong> ${callDuration} seconds</p>
      <p><strong>Action Required:</strong> ${
        decision === "email"
          ? "Send professional follow-up email with estimate details"
          : "Prepare calendar slots and confirm appointment time"
      }</p>
    `;

    console.log("📬 Internal notification:", { subject, body });
    return true;
  } catch (error) {
    console.error("Error sending internal notification:", error);
    return false;
  }
}

/**
 * Extract client information from caller data
 */
export function extractClientInfo(callerPhone: string, location?: string, webhookData?: any): ClientInfo {
  return {
    phone: callerPhone,
    location: location,
    estimateAddress: webhookData?.property_address,
    propertyType: webhookData?.property_type,
    bedrooms: webhookData?.bedrooms,
    bathrooms: webhookData?.bathrooms,
    preferredDate: webhookData?.preferred_date,
    preferredTime: webhookData?.preferred_time,
  };
}

/**
 * Get next Tuesday date
 */
function getNextTuesday(): string {
  const today = new Date();
  const daysUntilTuesday = (2 - today.getDay() + 7) % 7 || 7;
  const nextTuesday = new Date(today.setDate(today.getDate() + daysUntilTuesday));
  return nextTuesday.toISOString().split("T")[0];
}

/**
 * Get next Wednesday date
 */
function getNextWednesday(): string {
  const today = new Date();
  const daysUntilWednesday = (3 - today.getDay() + 7) % 7 || 7;
  const nextWednesday = new Date(
    today.setDate(today.getDate() + daysUntilWednesday)
  );
  return nextWednesday.toISOString().split("T")[0];
}

/**
 * Log decision to analytics
 */
export async function logDecisionAnalytics(
  decision: string,
  clientInfo: ClientInfo,
  callDuration: string,
  timestamp: string
): Promise<void> {
  try {
    const analyticsData = {
      event: "zapier_decision_received",
      decision_type: decision,
      caller_phone: clientInfo.phone,
      caller_location: clientInfo.location,
      call_duration_seconds: parseInt(callDuration),
      timestamp: timestamp,
      processed_at: new Date().toISOString(),
    };

    console.log("📊 Analytics event:", JSON.stringify(analyticsData, null, 2));
  } catch (error) {
    console.error("Error logging analytics:", error);
  }
}
