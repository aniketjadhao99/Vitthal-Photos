const axios = require('axios');

/**
 * Send SMS using Fast2SMS API
 */
const sendSMS = async (phoneNumber, message) => {
    try {
        const apiKey = process.env.FAST2SMS_API_KEY;
        if (!apiKey) {
            console.warn('[SMS Service] No Fast2SMS API Key found in .env');
            return false;
        }

        // Clean phone number (remove +91 or spaces)
        const cleanNumber = phoneNumber.replace(/\D/g, '').slice(-10);

        const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
            params: {
                authorization: apiKey,
                route: 'q',
                message: message,
                flash: 0,
                numbers: cleanNumber
            }
        });

        if (response.data.return) {
            console.log(`✅ [SMS Service] SMS sent to ${cleanNumber}`);
            return true;
        } else {
            console.error('❌ [SMS Service] Fast2SMS Error:', response.data.message);
            return false;
        }
    } catch (error) {
        console.error('❌ [SMS Service] API Error:', error.response?.data || error.message);
        return false;
    }
};

module.exports = { 
    sendSMS,
    sendOrderNotification: sendSMS
};
