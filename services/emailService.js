const nodemailer = require('nodemailer');

/**
 * Real Email Service using Nodemailer
 */
const sendEmail = async (email, subject, html) => {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

        if (!user || user.includes('your-gmail')) {
            console.warn('[Email Service] Gmail credentials not set in .env. Falling back to mock.');
            console.log(`[Email Mock] To: ${email} | Subject: ${subject}`);
            return true;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass
            }
        });

        const mailOptions = {
            from: `"Vitthal Photo Frames" <${user}>`,
            to: email,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [Email Service] Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ [Email Service] Error:', error.message);
        return false;
    }
};

module.exports = { 
    sendEmail,
    sendOrderNotification: sendEmail 
};
