const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "futboluagency@gmail.com",
    pass: "vdnf qcha qmmm otcd",
  },
});

const buildHtml = (title, content, cta) => `
<div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e8e3db;border-radius:12px;overflow:hidden">
  <div style="background:#1a1a2e;padding:22px 28px;text-align:center">
    <h1 style="color:#ffffff;margin:0;font-size:18px;font-weight:700;letter-spacing:-0.5px">FUTBOLUAGENCY</h1>
    <p style="color:#9ca3af;margin:6px 0 0;font-size:12px">Sports Scholarship Agency</p>
  </div>
  <div style="padding:28px">
    <h2 style="color:#1a1a2e;font-size:18px;margin:0 0 16px;font-weight:700">${title}</h2>
    ${content}
    ${cta ? `<div style="text-align:center;margin:24px 0">${cta}</div>` : ""}
    <hr style="border:none;border-top:1px solid #f0ebe3;margin:24px 0"/>
    <p style="color:#9ca3af;font-size:11px;margin:0">FUTBOLUAGENCY &nbsp;·&nbsp; futboluagency@gmail.com &nbsp;·&nbsp; +34 603 331 990</p>
  </div>
</div>`;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { type, to, subject, body, athleteName, profileUrl, coachName, eventTitle, eventDate, eventTime, senderName } = req.body;

  if (!to) return res.status(400).json({ error: "No recipient" });

  try {
    let html = "";
    let emailSubject = subject || "FUTBOLUAGENCY";

    if (type === "athlete_profile") {
      emailSubject = `Athlete Profile - ${athleteName} | FUTBOLUAGENCY`;
      const content = `
        <p style="color:#374151;font-size:14px;line-height:1.6">Dear ${coachName||"Coach"},</p>
        <p style="color:#374151;font-size:14px;line-height:1.6">We would like to introduce <strong>${athleteName}</strong>, a talented student-athlete seeking scholarship opportunities.</p>
        ${body ? `<p style="color:#374151;font-size:14px;line-height:1.6;white-space:pre-line">${body}</p>` : ""}`;
      const cta = profileUrl ? `<a href="${profileUrl}" style="background:#1a1a2e;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Full Profile</a>` : "";
      html = buildHtml(`Athlete Introduction: ${athleteName}`, content, cta);

    } else if (type === "calendar_invite") {
      emailSubject = `Reunion agendada: ${eventTitle} — ${eventDate}`;
      const content = `
        <div style="background:#f9f7f4;border:1px solid #e8e3db;border-radius:10px;padding:20px;margin:16px 0">
          <p style="margin:0 0 8px;color:#1a1a2e;font-size:16px;font-weight:700">${eventTitle}</p>
          <p style="margin:0 0 6px;color:#6b7280;font-size:14px">Fecha: <strong style="color:#1a1a2e">${eventDate}</strong></p>
          ${eventTime ? `<p style="margin:0 0 6px;color:#6b7280;font-size:14px">Hora: <strong style="color:#1a1a2e">${eventTime}</strong></p>` : ""}
          ${senderName ? `<p style="margin:0;color:#6b7280;font-size:14px">Convocado por: <strong style="color:#1a1a2e">${senderName}</strong></p>` : ""}
        </div>
        ${body ? `<p style="color:#374151;font-size:14px;line-height:1.6">${body}</p>` : ""}`;
      html = buildHtml("Tienes una reunion agendada", content, "");

    } else if (type === "lead_meeting") {
      emailSubject = `FUTBOLUAGENCY — Reunion contigo: ${eventTitle}`;
      const content = `
        <p style="color:#374151;font-size:14px;line-height:1.6">Hemos agendado una reunion contigo.</p>
        <div style="background:#f9f7f4;border:1px solid #e8e3db;border-radius:10px;padding:20px;margin:16px 0">
          <p style="margin:0 0 8px;color:#1a1a2e;font-size:15px;font-weight:700">${eventTitle}</p>
          <p style="margin:0 0 6px;color:#6b7280;font-size:14px">Fecha: <strong style="color:#1a1a2e">${eventDate}</strong></p>
          ${eventTime ? `<p style="margin:0;color:#6b7280;font-size:14px">Hora: <strong style="color:#1a1a2e">${eventTime}</strong></p>` : ""}
        </div>
        ${body ? `<p style="color:#374151;font-size:14px;line-height:1.6">${body}</p>` : ""}
        <p style="color:#374151;font-size:14px;">Si tienes preguntas contactanos: <strong>futboluagency@gmail.com</strong> o WhatsApp <strong>+34 603 331 990</strong></p>`;
      html = buildHtml("Reunion agendada contigo", content, "");

    } else {
      emailSubject = subject || "Mensaje de FUTBOLUAGENCY";
      const content = `<p style="color:#374151;font-size:14px;line-height:1.6;white-space:pre-line">${body||""}</p>`;
      html = buildHtml("Mensaje de FUTBOLUAGENCY", content, "");
    }

    await transporter.sendMail({
      from: '"FUTBOLUAGENCY" <futboluagency@gmail.com>',
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: emailSubject,
      html,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: error.message });
  }
};
