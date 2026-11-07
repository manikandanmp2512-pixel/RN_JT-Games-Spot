
const twilio = require("twilio");
const { parsePhoneNumberFromString } = require("libphonenumber-js/max");

let twilioClient = null;
let cachedAccountSid = null;

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    throw new Error("Twilio account configuration is incomplete.");
  }

  if (!/^AC[a-fA-F0-9]{32}$/.test(accountSid)) {
    throw new Error("Invalid Twilio Account SID.");
  }

  if (!twilioClient || cachedAccountSid !== accountSid) {
    twilioClient = twilio(accountSid, authToken);
    cachedAccountSid = accountSid;
  }

  return twilioClient;
};

const normalizeE164 = (value) => {
  const phone = parsePhoneNumberFromString(String(value || ""));

  if (!phone || !phone.isValid() || !phone.number.startsWith("+")) {
    throw new Error("Invalid international mobile number.");
  }

  if (phone.getType() === "FIXED_LINE") {
    throw new Error("Please enter a mobile number, not a landline.");
  }

  return phone.number;
};

const sendSms = async ({ to, body }) => {
  const number = normalizeE164(to);
  const messageBody = String(body || "").trim();

  if (!messageBody) {
    throw new Error("SMS message cannot be empty.");
  }

  const client = getTwilioClient();

  const messagingServiceSid =
    process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

  const from = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (!messagingServiceSid && !from) {
    throw new Error(
      "Configure TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID."
    );
  }

  const options = {
    to: number,
    body: messageBody,
  };

  if (messagingServiceSid) {
    if (!/^MG[a-fA-F0-9]{32}$/.test(messagingServiceSid)) {
      throw new Error("Invalid Twilio Messaging Service SID.");
    }

    options.messagingServiceSid = messagingServiceSid;
  } else {
    options.from = from;
  }

  return client.messages.create(options);
};

module.exports = {
  sendSms,
  normalizeE164,
};
