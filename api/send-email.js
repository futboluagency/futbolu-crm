const nodemailer = require("nodemailer");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { emails, subject, message, athleteName, profileLink } = req.body;

  if (!emails || emails.length === 0) return res.status(400).json({ error: "No emails provided" });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "futboluagency@gmail.com",
      pass: "reio yyfz ykta gidz",
    },
  });

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; letter-spacing: 2px;">FUTBOLUAGENCY</h1>
      <p style="color: #9ca3af; margin: 8px 0 0; font-size: 13px;">Athlete Recruitment Specialists</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-line;">${message}</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${profileLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: bold;">
          View Full Athlete Profile →
        </a>
      </div>
    </div>
    <div style="background: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        <strong>Moha</strong> — CEO, FUTBOLUAGENCY<br>
        📧 futboluagency@gmail.com &nbsp;|&nbsp; 📱 WhatsApp: +34 603 331 990
      </p>
    </div>
  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: '"FUTBOLUAGENCY" <futboluagency@gmail.com>',
      bcc: emails.join(","),
      subject: subject || `Athlete Profile — ${athleteName} | FUTBOLUAGENCY`,
      html: htmlBody,
    });
    return res.status(200).json({ success: true, count: emails.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
};
