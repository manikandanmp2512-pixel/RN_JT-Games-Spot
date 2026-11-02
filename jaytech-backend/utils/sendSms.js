const twilio = require("twilio");

let twilioClient = null;

const getVerifyService = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const verifyServiceSid =
    process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

  const missing = [];

  if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!authToken) missing.push("TWILIO_AUTH_TOKEN");
  if (!verifyServiceSid) {
    missing.push("TWILIO_VERIFY_SERVICE_SID");
  }

  if (missing.length) {
    throw new Error(
      `Twilio Verify configuration is missing: ${missing.join(", ")}`
    );
  }

  if (!/^AC[a-fA-F0-9]{32}$/.test(accountSid)) {
    throw new Error("Invalid Twilio Account SID format.");
  }

  if (!/^VA[a-fA-F0-9]{32}$/.test(verifyServiceSid)) {
    throw new Error("Invalid Twilio Verify Service SID format.");
  }

  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient.verify.v2.services(verifyServiceSid);
};

const sendSms = async ({ to }) => {
  if (!to || !/^\+[1-9]\d{7,14}$/.test(to)) {
    throw new Error("A valid E.164 mobile number is required.");
  }

  return getVerifyService().verifications.create({
    to,
    channel: "sms",
  });
};

const verifySmsOtp = async ({ to, code }) => {
  if (!to || !/^\+[1-9]\d{7,14}$/.test(to)) {
    throw new Error("A valid E.164 mobile number is required.");
  }

  if (!/^\d{4,10}$/.test(String(code))) {
    return false;
  }

  const result = await getVerifyService().verificationChecks.create({
    to,
    code: String(code),
  });

  return result.status === "approved";
};

module.exports = {
  sendSms,
  verifySmsOtp,
};