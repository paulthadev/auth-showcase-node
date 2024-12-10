const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const config = require("../config/variables");

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

// Add this new function for SMTP connection verification
const verifySmtpConnection = async () => {
  try {
    await transporter.verify();
    console.log("SMTP Server is ready");
    return true;
  } catch (error) {
    console.error("SMTP Connection Error:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return false;
  }
};

const testSmtpConnection = async () => {
  try {
    // Verify connection
    await transporter.verify();
    console.log("SMTP Connection Successful");

    // Attempt to send a test email
    const testInfo = await transporter.sendMail({
      from: config.EMAIL_USER,
      to: config.EMAIL_USER,
      subject: "SMTP Test",
      text: "SMTP connection test",
    });

    console.log("Test Email Sent:", testInfo);
    return true;
  } catch (error) {
    console.error("SMTP Connection Test Failed:", {
      message: error.message,
      code: error.code,
      response: error.response,
    });
    return false;
  }
};

testSmtpConnection();

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verify SMTP connection before proceeding
    const isSmtpReady = await verifySmtpConnection();
    if (!isSmtpReady) {
      return res.status(500).json({
        message: "Email service is currently unavailable",
        error: "SMTP connection failed",
      });
    }

    // Rest of the existing registration logic...
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    user = new User({
      username,
      email,
      password: hashedPassword,
      verificationToken,
    });

    await user.save();

    const verificationLink = `${config.FRONTEND_URL}/verify/${verificationToken}`;

    try {
      const mailOptions = {
        from: config.EMAIL_USER,
        to: email,
        subject: "Verify Your Account",
        html: `
          <h1>Account Verification</h1>
          <p>Click the link below to verify your account:</p>
          <a href="${verificationLink}">Verify Account</a>
          <p>If you didn't create an account, please ignore this email.</p>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info);
    } catch (emailError) {
      console.error("Detailed Email Sending Error:", {
        message: emailError.message,
        code: emailError.code,
        response: emailError.response,
      });

      return res.status(500).json({
        message: "User registered, but failed to send verification email",
        error: emailError.message,
      });
    }

    res.status(201).json({ message: "User registered. Check your email." });
  } catch (error) {
    console.error("Registration Error Details:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
