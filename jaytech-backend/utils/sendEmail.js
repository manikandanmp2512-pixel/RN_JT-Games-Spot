
const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS is missing. Check backend .env."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass.replace(/\s/g, ""),
    },
  });

  try {
    const result = await transporter.sendMail({
      from: `"Jay Tech" <${emailUser}>`,
      to,
      subject,
      text,
    });

    console.log(
      "Jay Tech email sent successfully:",
      result.messageId
    );

    return result;
  } catch (error) {
    // Preserve the original Gmail error for debugging.
    console.error("ORIGINAL GMAIL ERROR:", {
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
      message: error.message,
    });

    throw error;
  }
};

module.exports = sendEmail;
