// utility helpers shared by multiple form modules
const { sanitiseString } = require('../lib/utils');
const {
  ROLE_OPTIONS,
  EMAIL_REGEX,
  PASSWORD_REGEX,
  NAME_REGEX
} = require('../lib/validationConstants');

// take the raw request body submitted from the registration and tidy it up 
// keep most values as strings because HTML inputs expect strings
function parseRegistrationForm(body) {
  const form = {};
  const emailInput = sanitiseString(body && body.email);
  form.email = emailInput ? emailInput.toLowerCase() : '';

  // passwords are left untouched so no accidental stripping characters the user intended to include
  if (body && typeof body.password === 'string') {
    form.password = body.password;
  } else {
    form.password = '';
  }

  if (body && typeof body.confirmPassword === 'string') {
    form.confirmPassword = body.confirmPassword;
  } else {
    form.confirmPassword = '';
  }

  form.fullname = sanitiseString(body && body.fullname);
  const roleInput = sanitiseString(body && body.role);
  form.role = roleInput ? roleInput.toLowerCase() : '';
  form.phone = sanitiseString(body && body.phone);
  return form;
}

// remove common phone number formatting so validation can focus on the digits
function stripPhoneFormatting(value) {
  return (value || '').replace(/[\s()-]/g, '');
}

// basic checks for Australian phone numbers
// support both local (0) and international (+61) formats
function isAustralianPhoneNumber(value) {
  const cleaned = stripPhoneFormatting(value);
  if (!cleaned) {
    return false;
  }
  if (cleaned.indexOf('+') === 0) {
    if (cleaned.indexOf('+61') !== 0) {
      return false;
    }
    // after removing the +61 prefix, Australian numbers should be 9 digits
    const rest = cleaned.slice(3);
    return rest.length === 9 && /^[2-478]\d{8}$/.test(rest);
  }
  if (cleaned.indexOf('0') === 0) {
    // local format must start with 0 and have 10 digits total
    return cleaned.length === 10 && /^[2-478]\d{9}$/.test(cleaned);
  }
  return false;
}

// validate each registration field and return the messages that should be shown to the user
function collectRegistrationErrors(form) {
  const errors = [];

  if (!form.email) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(form.email)) {
    errors.push('Enter a valid email address');
  }

  if (!form.password) {
    errors.push('Password is required');
  } else if (!PASSWORD_REGEX.test(form.password)) {
    errors.push('Password must be at least 8 characters with upper, lower, number and special character');
  }

  if (!form.confirmPassword) {
    errors.push('Confirm your password');
  } else if (form.password !== form.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!form.fullname) {
    errors.push('Full name is required');
  } else if (!NAME_REGEX.test(form.fullname)) {
    errors.push('Full name can only include letters, spaces, hyphens and apostrophes');
  }

  if (!form.role) {
    errors.push('Role is required');
  } else if (ROLE_OPTIONS.indexOf(form.role) === -1) {
    errors.push('Select a valid role');
  }

  if (!form.phone) {
    errors.push('Phone number is required');
  } else if (!isAustralianPhoneNumber(form.phone)) {
    errors.push('Enter a valid Australian phone number');
  }

  return errors;
}

// repopulating the form after a failed registration attempt
function buildRegistrationValues(form) {
  return {
    email: form.email || '',
    fullname: form.fullname || '',
    role: form.role || '',
    phone: form.phone || ''
  };
}

// parse the login form
// passwords are left untouched 
function parseLoginForm(body) {
  const form = {};
  const emailInput = sanitiseString(body && body.email);
  form.email = emailInput ? emailInput.toLowerCase() : '';
  if (body && typeof body.password === 'string') {
    form.password = body.password;
  } else {
    form.password = '';
  }
  return form;
}

// login forms show a single message if either field is missing and only perform validation when both values are present
function collectLoginErrors(form) {
  const errors = [];

  const missingEmail = !form.email || !form.email.trim();
  const missingPassword = !form.password || !form.password.trim();

  // if either is missing, show one combined message and skip the rest
  if (missingEmail || missingPassword) {
    errors.push('Email or password is required');
  } else if (!EMAIL_REGEX.test(form.email)) {
    // only validate formats when both are present
    errors.push('Enter a valid email address');
  }
  return errors;
}

module.exports = {
  ROLE_OPTIONS,
  parseRegistrationForm,
  collectRegistrationErrors,
  buildRegistrationValues,
  parseLoginForm,
  collectLoginErrors,
  stripPhoneFormatting,
  isAustralianPhoneNumber
};