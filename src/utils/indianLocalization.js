// Indian Localization Utilities
// Formats for Indian phone numbers, currency, dates, etc.

/**
 * Format Indian phone number
 * Accepts: 10-digit number, with or without country code
 * Returns: +91 XXXXXXXXXX format
 */
export const formatIndianPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 91, remove it (we'll add it back)
  const cleanNumber = digits.startsWith('91') && digits.length > 10 
    ? digits.substring(2) 
    : digits;
  
  // Must be 10 digits
  if (cleanNumber.length !== 10) return phone;
  
  // Format as +91 XXXXXXXXXX
  return `+91 ${cleanNumber.substring(0, 5)} ${cleanNumber.substring(5)}`;
};

/**
 * Validate Indian phone number
 * Accepts: 10-digit number starting with 6-9
 */
export const validateIndianPhone = (phone) => {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Remove country code if present
  const cleanNumber = digits.startsWith('91') && digits.length > 10 
    ? digits.substring(2) 
    : digits;
  
  // Must be exactly 10 digits and start with 6, 7, 8, or 9
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleanNumber);
};

/**
 * Format currency in Indian Rupees (INR)
 * @param {number|string} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show ₹ symbol (default: true)
 * @returns {string} Formatted currency string
 */
export const formatIndianCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || amount === '') return showSymbol ? '₹0' : '0';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[₹,\s]/g, '')) : amount;
  
  if (isNaN(numAmount)) return showSymbol ? '₹0' : '0';
  
  // Format with Indian number system (lakhs, crores)
  // For amounts less than 1 lakh, show normally
  if (numAmount < 100000) {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
    
    return showSymbol ? formatted : formatted.replace('₹', '').trim();
  }
  
  // For amounts >= 1 lakh, use Indian notation
  if (numAmount < 10000000) {
    // Lakhs
    const lakhs = (numAmount / 100000).toFixed(2);
    return showSymbol ? `₹${lakhs}L` : `${lakhs}L`;
  } else {
    // Crores
    const crores = (numAmount / 10000000).toFixed(2);
    return showSymbol ? `₹${crores}Cr` : `${crores}Cr`;
  }
};

/**
 * Format hourly rate in INR
 * @param {number|string} rate - Hourly rate
 * @returns {string} Formatted rate string
 */
export const formatHourlyRate = (rate) => {
  if (!rate) return '₹0/hr';
  return `${formatIndianCurrency(rate, true)}/hr`;
};

/**
 * Format salary range in INR
 * @param {number|string} min - Minimum salary
 * @param {number|string} max - Maximum salary (optional)
 * @returns {string} Formatted salary string
 */
export const formatSalaryRange = (min, max = null) => {
  if (!min && !max) return 'Not specified';
  
  const minFormatted = formatIndianCurrency(min, true);
  
  if (!max || min === max) {
    return minFormatted;
  }
  
  const maxFormatted = formatIndianCurrency(max, true);
  return `${minFormatted} - ${maxFormatted}`;
};

/**
 * Format date in Indian format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatIndianDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Format date with time in Indian format
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date-time string
 */
export const formatIndianDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Get Indian state list (common states)
 */
export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

/**
 * Get major Indian cities
 */
export const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Amritsar', 'Noida'
];

