const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a property transfer confirmation email to the buyer.
 */
async function sendTransferConfirmation({
  buyerEmail,
  buyerName,
  propertyAddress,
  previousOwner,
  explorerUrl,
  transferCount,
}) {
  const explorerLine = explorerUrl
    ? `<p style="margin:8px 0"><strong>Solana Explorer:</strong> <a href="${explorerUrl}" style="color:#10b981">${explorerUrl}</a></p>`
    : "";

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:auto;background:#0f3b2e;color:#ecfdf5;padding:32px;border-radius:16px">
      <h1 style="font-size:22px;font-weight:700;margin-bottom:4px">Property Transfer Confirmed</h1>
      <p style="color:#6ee7b7;margin-top:0;margin-bottom:24px">Recorded on Solana Devnet by DeedLock Holmes</p>

      <div style="background:#0a2e23;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:8px 0"><strong>Property:</strong> ${propertyAddress}</p>
        <p style="margin:8px 0"><strong>New Owner:</strong> ${buyerName}</p>
        <p style="margin:8px 0"><strong>Previous Owner:</strong> ${previousOwner}</p>
        <p style="margin:8px 0"><strong>Total Transfers:</strong> ${transferCount}</p>
        ${explorerLine}
      </div>

      <p style="font-size:13px;color:#6ee7b7">
        This deed has been registered on the Solana blockchain via DeedLock Holmes.
        Keep this email as proof of ownership.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"DeedLock Holmes" <${process.env.EMAIL_USER}>`,
    to: buyerEmail,
    subject: `Property Transfer Confirmed — ${propertyAddress}`,
    html,
  });
}

module.exports = { sendTransferConfirmation };
