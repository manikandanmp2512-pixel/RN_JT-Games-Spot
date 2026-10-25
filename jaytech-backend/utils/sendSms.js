
const twilio = require("twilio");

const sendSms = async ({ to, message }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim();

  console.log("Twilio SID diagnostic:", {
    present: Boolean(accountSid),
    startsWithAC: accountSid?.startsWith("AC"),
    length: accountSid?.length,
    validFormat: /^AC[a-fA-F0-9]{32}$/.test(accountSid || ""),
  });

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error(
      "Twilio configuration is missing. Check your backend .env file."
    );
  }

  // Twilio SID = AC followed by 32 hexadecimal characters.
  if (!/^AC[a-fA-F0-9]{32}$/.test(accountSid)) {
    throw new Error(
      "Invalid Twilio Account SID. Check the actual SID in Twilio Console."
    );
  }

  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    throw new Error(
      "Recipient mobile number must use international format, e.g. +919876543210."
    );
  }

  // Create the client only after credentials are declared.
  const client = twilio(accountSid, authToken);

  try {
    const result = await client.messages.create({
      body: message,
      from: phoneNumber,
      to,
    });

    console.log("Twilio message accepted:", {
      messageSid: result.sid,
      status: result.status,
    });

    return result;
  } catch (error) {
    console.error("Twilio SMS error:", {
      code: error.code,
      status: error.status,
      message: error.message,
    });

    throw new Error(`Twilio SMS failed: ${error.message}`);
  }
};

module.exports = sendSms;
