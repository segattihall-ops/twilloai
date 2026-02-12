export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/xml");

  const twiml = `
    <Response>
      <Say voice="Polly.Joanna">
        Hello. Your AI assistant is now working from Vercel.
      </Say>
    </Response>
  `;

  res.status(200).send(twiml);
}