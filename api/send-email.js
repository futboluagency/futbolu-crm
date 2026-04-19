const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "futboluagency@gmail.com",
    pass: "yauc hasu jzae mieu",
  },
});

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, to, subject, body, athleteName, profileUrl, coachName, eventTitle, eventDate, eventTime, senderName } = req.body;

  try {
    let htmlContent = "";
    let emailSubject = subject || "FUTBOLUAGENCY";

    if (type === "athlete_profile") {
      emailSubject = `Athlete Profile - ${athleteName} | FUTBOLUAGENCY`;
      htmlContent = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8e3db;border-radius:12px;overflow:hidden">
          <div style="background:#1a1a2e;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">FUTBOLUAGENCY</h1>
            <p style="color:#9ca3af;margin:8px 0 0;font-size:13px">Student-Athlete Recruitment</p>
          </div>
          <div style="padding:28px">
            <p style="color:#374151;font-size:14px">Dear ${coachName||"Coach"},</p>
            <p style="color:#374151;font-size:14px;line-height:1.6">We would like to introduce you to <strong>${athleteName}</strong>, a talented student-athlete currently seeking scholarship opportunities.</p>
            <div style="text-align:center;margin:24px 0">
              <a href="${profileUrl}" style="background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Full Profile</a>
            </div>
            ${body ? `<p style="color:#374151;font-size:14px;line-height:1.6;white-space:pre-line">${body}</p>` : ""}
            <hr style="border:none;border-top:1px solid #f0ebe3;margin:24px 0"/>
            <p style="color:#9ca3af;font-size:12px">FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990</p>
          </div>
        </div>`;
    } else if (type === "calendar_invite") {
      emailSubject = `Reunion agendada: ${eventTitle} - ${eventDate}`;
      htmlContent = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8e3db;border-radius:12px;overflow:hidden">
          <div style="background:#1a1a2e;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">FUTBOLUAGENCY</h1>
          </div>
          <div style="padding:28px">
            <h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px">Tienes una reunion agendada</h2>
            <div style="background:#f9f7f4;border:1px solid #e8e3db;border-radius:10px;padding:20px;margin-bottom:20px">
              <p style="margin:0 0 8px;color:#1a1a2e;font-size:16px;font-weight:700">${eventTitle}</p>
              <p style="margin:0 0 6px;color:#6b7280;font-size:14px">Fecha: <strong style="color:#1a1a2e">${eventDate}</strong></p>
              ${eventTime ? `<p style="margin:0 0 6px;color:#6b7280;font-size:14px">Hora: <strong style="color:#1a1a2e">${eventTime}</strong></p>` : ""}
              ${senderName ? `<p style="margin:0;color:#6b7280;font-size:14px">Convocado por: <strong style="color:#1a1a2e">${senderName}</strong></p>` : ""}
            </div>
            ${body ? `<p style="color:#374151;font-size:14px;line-height:1.6">${body}</p>` : ""}
            <hr style="border:none;border-top:1px solid #f0ebe3;margin:24px 0"/>
            <p style="color:#9ca3af;font-size:12px">FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990</p>
          </div>
        </div>`;
    } else if (type === "lead_meeting") {
      emailSubject = `Reunion con lead: ${eventTitle} - ${eventDate}`;
      htmlContent = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8e3db;border-radius:12px;overflow:hidden">
          <div style="background:#1a1a2e;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">FUTBOLUAGENCY</h1>
          </div>
          <div style="padding:28px">
            <h2 style="color:#1a1a2e;font-size:18px;margin:0 0 8px">Reunion con lead agendada</h2>
            <div style="background:#f9f7f4;border:1px solid #e8e3db;border-radius:10px;padding:20px;margin:16px 0">
              <p style="margin:0 0 8px;color:#1a1a2e;font-size:16px;font-weight:700">${eventTitle}</p>
              <p style="margin:0 0 6px;color:#6b7280;font-size:14px">Fecha: <strong style="color:#1a1a2e">${eventDate}</strong></p>
              ${eventTime ? `<p style="margin:0 0 6px;color:#6b7280;font-size:14px">Hora: <strong style="color:#1a1a2e">${eventTime}</strong></p>` : ""}
            </div>
            ${body ? `<p style="color:#374151;font-size:14px;line-height:1.6">${body}</p>` : ""}
            <hr style="border:none;border-top:1px solid #f0ebe3;margin:24px 0"/>
            <p style="color:#9ca3af;font-size:12px">FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990</p>
          </div>
        </div>`;
    } else {
      // Generic email
      htmlContent = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8e3db;border-radius:12px;overflow:hidden">
          <div style="background:#1a1a2e;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:20px">FUTBOLUAGENCY</h1>
          </div>
          <div style="padding:28px">
            <p style="color:#374151;font-size:14px;line-height:1.6;white-space:pre-line">${body||""}</p>
            <hr style="border:none;border-top:1px solid #f0ebe3;margin:24px 0"/>
            <p style="color:#9ca3af;font-size:12px">FUTBOLUAGENCY | futboluagency@gmail.com | +34 603 331 990</p>
          </div>
        </div>`;
    }

    await transporter.sendMail({
      from: '"FUTBOLUAGENCY" <futboluagency@gmail.com>',
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: emailSubject,
      html: htmlContent,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: error.message });
  }
};
