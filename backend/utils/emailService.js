const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (email, resetUrl) => {
    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const message = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset Request - ChitFund App',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>You requested a password reset for your ChitFund account.</p>
                <p>Please click the button below to reset your password:</p>
                <div style="margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #2563eb; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="color: #666; word-break: break-all;">${resetUrl}</p>
                <p style="color: #dc2626; margin-top: 20px;">
                    <strong>This link will expire in 10 minutes.</strong>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    If you didn't request this password reset, please ignore this email.
                </p>
            </div>
        `,
    };

    await transporter.sendMail(message);
};

module.exports = { sendPasswordResetEmail };
