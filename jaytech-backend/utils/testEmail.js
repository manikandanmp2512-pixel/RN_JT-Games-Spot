require("dotenv").config();

const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("EMAIL_USER loaded:", Boolean(process.env.EMAIL_USER));
  console.log("EMAIL_PASS loaded:", Boolean(process.env.EMAIL_PASS));

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
    },
  });

  try {
    await transporter.verify();
    console.log("Gmail authentication successful!");

    const result = await transporter.sendMail({
      from: `"Jay Tech" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Jay Tech OTP Test",
      text: "Your Gmail email service is working.",
    });

    console.log("Test email sent:", result.messageId);
  } catch (error) {
    console.error("GMAIL TEST FAILED:", error.code);
    console.error("Error message:", error.message);
  }
}

testEmail();