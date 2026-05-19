// Input validation utilities for all endpoints
const validator = require('validator');

const validators = {
  // Email validation
  validateEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    return validator.isEmail(email.toLowerCase().trim());
  },

  // Password validation - minimum 8 chars, uppercase, lowercase, number, special char
  validatePassword: (password) => {
    if (!password || typeof password !== 'string' || password.length < 8) return false;
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  },

  // Phone validation - Indian format
  validatePhone: (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    return validator.isMobilePhone(phone, ['en-IN']);
  },

  // Name validation
  validateName: (name) => {
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) return false;
    return /^[a-zA-Z\s'-]+$/.test(name.trim()); // Only letters, spaces, hyphens, apostrophes
  },

  // Address validation
  validateAddress: (address) => {
    if (!address || typeof address !== 'string' || address.trim().length < 5 || address.trim().length > 200) return false;
    return true;
  },

  // Postal code validation - India
  validatePostalCode: (code) => {
    if (!code || typeof code !== 'string') return false;
    return /^\d{6}$/.test(code.replace(/\s/g, ''));
  },

  // City validation
  validateCity: (city) => {
    if (!city || typeof city !== 'string' || city.trim().length < 2 || city.trim().length > 50) return false;
    return /^[a-zA-Z\s'-]+$/.test(city.trim());
  },

  // Amount validation - positive number
  validateAmount: (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 9999999;
  },

  // SKU validation
  validateSKU: (sku) => {
    if (!sku || typeof sku !== 'string') return false;
    return /^[A-Z0-9\-]{3,50}$/.test(sku.trim());
  },

  // URL validation
  validateURL: (url) => {
    if (!url || typeof url !== 'string') return false;
    return validator.isURL(url, { require_protocol: true });
  },

  // Sanitize object - removes dangerous fields
  sanitizeObject: (obj, allowedFields = []) => {
    const sanitized = {};
    for (const field of allowedFields) {
      if (field in obj) {
        sanitized[field] = obj[field];
      }
    }
    return sanitized;
  },

  // Validate object ID format (MongoDB)
  validateMongoID: (id) => {
    return validator.isMongoId(id);
  },

  // Validate enum - ensure value is in allowed list
  validateEnum: (value, allowedValues) => {
    return allowedValues.includes(value);
  },

  // Validate string length
  validateLength: (str, min = 1, max = 1000) => {
    return typeof str === 'string' && str.trim().length >= min && str.trim().length <= max;
  },

  // Validate array
  validateArray: (arr, minLength = 1, maxLength = 100) => {
    return Array.isArray(arr) && arr.length >= minLength && arr.length <= maxLength;
  },
};

module.exports = validators;
