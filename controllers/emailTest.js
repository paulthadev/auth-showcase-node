const nodemailer = require("nodemailer");
const config = require("../config/variables");

console.log("config.EMAIL_USER", config.EMAIL_USER);
console.log("config.EMAIL_PASS", config.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: "mail.gotipmi.com",
  port: 465,
  secure: true,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  logger: true,
  debug: true,
});

// Add this test function
const testEmailSend = async () => {
  try {
    // First, verify the connection
    await transporter.verify();
    console.log("SMTP Server connection verified successfully 465");

    // Then attempt to send a test email
    const testResult = await transporter.sendMail({
      from: config.EMAIL_USER,
      to: config.EMAIL_USER, // Send to yourself
      subject: "SMTP Configuration Test",
      text: "This is a test email to verify SMTP configuration.",
      html: "<p>This is a test email to verify SMTP configuration.</p>",
    });

    console.log("Test Email Send Result:", {
      messageId: testResult.messageId,
      response: testResult.response,
      accepted: testResult.accepted,
      rejected: testResult.rejected,
    });

    return true;
  } catch (error) {
    console.error("Detailed SMTP Test Error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      response: error.response,
    });
    console.log("config.EMAIL_USER", config.EMAIL_USER);
    console.log("config.EMAIL_PASS", config.EMAIL_PASS);
    return false;
  }
};

// You can call this function to test
testEmailSend();

module.exports = { transporter, testEmailSend };
