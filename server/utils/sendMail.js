import nodemailer from "nodemailer";

export const sendOTPEmail = async (email) => {

    const otp = Math.floor(100000 + Math.random() * 900000); // returns 6-digit number
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"QA Skills" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 QA Skills OTP Verification",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333;">Email Verification Code</h2>
        <p>Hello,</p>
        <p>Use the following OTP to complete your registration on <strong>QA Skills</strong>:</p>
        <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #2e7d32;">
          ${otp}
        </div>
        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p>If you did not request this, you can ignore this email.</p>
        <br />
        <p>Regards,<br/><strong>QA Skills Team</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  return otp;
};
