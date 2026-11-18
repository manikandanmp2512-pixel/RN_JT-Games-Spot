// const twilio = require("twilio");
// const { parsePhoneNumberFromString } = require("libphonenumber-js/max");

// let client;
// let cachedAccountSid;

// const normalizeE164 = (value) => {
//   const parsed = parsePhoneNumberFromString(String(value || "").trim());
//   if (!parsed || !parsed.isValid() || !parsed.number.startsWith("+")) {
//     throw new Error("Please enter a valid international mobile number.");
//   }
//   if (parsed.getType() === "FIXED_LINE") {
//     throw new Error("Please enter a mobile number, not a landline.");
//   }
//   return parsed.number;
// };

// const getClient = () => {
//   const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
//   const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
//   const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

//   if (!accountSid || !authToken || !serviceSid) {
//     throw new Error("Twilio Verify configuration is incomplete. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID.");
//   }
//   if (!/^AC[a-fA-F0-9]{32}$/.test(accountSid)) {
//     throw new Error("TWILIO_ACCOUNT_SID is invalid.");
//   }
//   if (!/^VA[a-fA-F0-9]{32}$/.test(serviceSid)) {
//     throw new Error("TWILIO_VERIFY_SERVICE_SID is invalid. It must start with VA.");
//   }

//   if (!client || cachedAccountSid !== accountSid) {
//     client = twilio(accountSid, authToken);
//     cachedAccountSid = accountSid;
//   }
//   return { client, serviceSid };
// };

// const sendVerification = async (mobile) => {
//   const to = normalizeE164(mobile);
//   const { client, serviceSid } = getClient();
//   const result = await client.verify.v2
//     .services(serviceSid)
//     .verifications.create({ to, channel: "sms" });

//   return { to, status: result.status };
// };

// const checkVerification = async (mobile, code) => {
//   const to = normalizeE164(mobile);
//   const otp = String(code || "").trim();
//   if (!/^\d{4,10}$/.test(otp)) {
//     throw new Error("Enter the verification code sent to your mobile.");
//   }

//   const { client, serviceSid } = getClient();
//   const result = await client.verify.v2
//     .services(serviceSid)
//     .verificationChecks.create({ to, code: otp });

//   return { to, status: result.status, approved: result.status === "approved" };
// };

// module.exports = { normalizeE164, sendVerification, checkVerification };
