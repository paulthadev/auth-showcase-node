const nodemailer = require("nodemailer");
const config = require("../config/variables");

const transporter = nodemailer.createTransport({
  host: "gotipmi.com",
  port: 587,
  secure: false,
  auth: {
    user: "noreply@gotipmi.com",
    pass: "pjq#c8#FLNMGe$u",
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
    console.log("SMTP Server connection verified successfully");

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
    return false;
  }
};

// You can call this function to test
testEmailSend();

module.exports = { transporter, testEmailSend };
