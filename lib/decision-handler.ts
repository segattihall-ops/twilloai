/**
 * Utilities for handling different decision types from Zapier webhook
 */

export interface DecisionData {
  caller_phone: string;
  caller_location: string;
  call_duration: string;
  decision: string;
}

/**
 * Generate email template for customer follow-up
 */
export function generateEmailTemplate(data: DecisionData): any {
  return {
    to: data.caller_phone, // In production, extract email from caller_phone lookup
    subject: "Your Brazilian Blessed Cleaning Estimate - Next Steps",
    body: `
      <h2>Thank You for Your Interest!</h2>
      
      <p>Thank you for speaking with Sarah from Brazilian Blessed Cleaning. We're excited to help transform your home with our professional cleaning services.</p>
      
      <h3>Your Call Summary:</h3>
      <ul>
        <li><strong>Location:</strong> ${data.caller_location}</li>
        <li><strong>Call Duration:</strong> ${data.call_duration} seconds</li>
        <li><strong>Service Interest:</strong> In-person cleaning estimate</li>
      </ul>
      
      <h3>Next Steps:</h3>
      <p>Our team will contact you within 24 hours to confirm your in-person estimate appointment. We have availability:</p>
      <ul>
        <li>Tuesday: 10 AM - 12 PM</li>
        <li>Wednesday: 2 PM - 4 PM</li>
      </ul>
      
      <h3>Why Choose Brazilian Blessed Cleaning?</h3>
      <ul>
        <li>Professional and trained cleaning specialists</li>
        <li>Luxury-level service quality</li>
        <li>Personalized cleaning plans</li>
        <li>Competitive pricing</li>
        <li>100% satisfaction guaranteed</li>
      </ul>
      
      <p>If you have any questions, please don't hesitate to reach out. We look forward to meeting you!</p>
      
      <p>Best regards,<br/>
      <strong>Brazilian Blessed Cleaning Team</strong><br/>
      Phone: ${process.env.TWILIO_PHONE_NUMBER}<br/>
      Hours: Monday-Saturday, 9 AM - 5 PM</p>
    `,
    type: "email_followup",
    priority: "high",
  };
}

/**
 * Generate calendar invitation data
 */
export function generateCalendarInvitation(data: DecisionData): any {
  return {
    title: "Brazilian Blessed Cleaning Estimate",
    description: `
      In-person cleaning estimate for client from ${data.caller_location}
      
      Call duration: ${data.call_duration} seconds
      Contact: ${data.caller_phone}
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
    attendees: [
      {
        email: "team@brazilianblessed.com",
        name: "Brazilian Blessed Cleaning Team",
        role: "organizer",
      },
    ],
    location: data.caller_location,
    type: "calendar_booking",
    priority: "high",
  };
}

/**
 * Send email notification to internal team
 */
export async function sendInternalNotification(
  decision: string,
  data: DecisionData
): Promise<boolean> {
  try {
    if (!process.env.TEAM_EMAIL) {
      console.warn("TEAM_EMAIL not configured");
      return false;
    }

    const subject =
      decision === "email"
        ? `📧 Email Follow-up Requested - ${data.caller_location}`
        : `📅 Calendar Booking Requested - ${data.caller_location}`;

    const body = `
      <h2>New Decision from Caller</h2>
      <p><strong>Decision Type:</strong> ${decision}</p>
      <p><strong>Caller Location:</strong> ${data.caller_location}</p>
      <p><strong>Caller Phone:</strong> ${data.caller_phone}</p>
      <p><strong>Call Duration:</strong> ${data.call_duration} seconds</p>
      <p><strong>Action Required:</strong> ${
        decision === "email"
          ? "Send professional follow-up email"
          : "Prepare calendar slots and confirm appointment"
      }</p>
    `;

    // In production, integrate with email service
    // await sendEmail(process.env.TEAM_EMAIL, subject, body);

    console.log("📧 Internal notification template:", { subject, body });
    return true;
  } catch (error) {
    console.error("Error sending internal notification:", error);
    return false;
  }
}

/**
 * Extract client information from caller data
 */
export function extractClientInfo(callerPhone: string, location: string) {
  return {
    phone: callerPhone,
    location: location,
    source: "phone_call",
    created_at: new Date().toISOString(),
    status: "active",
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
  data: DecisionData
): Promise<void> {
  try {
    const analyticsData = {
      event: "zapier_decision_received",
      decision_type: decision,
      caller_location: data.caller_location,
      call_duration_seconds: parseInt(data.call_duration),
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Analytics event:", analyticsData);

    // In production, send to analytics service
    // await analytics.track(analyticsData);
  } catch (error) {
    console.error("Error logging analytics:", error);
  }
}
