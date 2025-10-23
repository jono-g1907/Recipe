const express = require('express');
const ValidationError = require('../errors/ValidationError');
const normaliseError = require('../lib/normaliseError');
const {
  parseRegistrationForm,
  collectRegistrationErrors,
  buildRegistrationValues,
  parseLoginForm,
  collectLoginErrors
} = require('../forms/userForm');
const { sanitiseString } = require('../lib/utils');
const constants = require('../lib/constants');
const store = require('../store');

const router = express.Router();
const APP_ID = constants.APP_ID;

function buildUserResponse(user) {
  if (!user) {
    return null;
  }
  return {
    userId: user.userId,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
    phone: user.phone,
    isLoggedIn: user.isLoggedIn || false
  };
}

router.post('/auth/register-' + APP_ID, async function (req, res, next) {
  try {
    const form = parseRegistrationForm(req.body || {});
    const errors = collectRegistrationErrors(form);

    if (!errors.length) {
      const existing = await store.getUserByEmail(form.email);
      if (existing) {
        errors.push('That email address is already registered');
      }
    }

    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const created = await store.createUser({
      email: form.email,
      password: form.password,
      fullname: form.fullname,
      role: form.role,
      phone: form.phone
    });

    return res.status(201).json({ success: true, user: buildUserResponse(created) });
  } catch (err) {
    const normalised = normaliseError(err);
    if (normalised instanceof ValidationError) {
      const retryForm = parseRegistrationForm(req.body || {});
      const values = buildRegistrationValues(retryForm);
      const message =
        normalised.errors && normalised.errors.length
          ? normalised.errors.join(' ')
          : 'Registration failed';
      return res.status(400).json({ success: false, message: message, values: values });
    }
    next(err);
  }
});

router.post('/auth/login-' + APP_ID, async function (req, res, next) {
  try {
    const form = parseLoginForm(req.body || {});
    const errors = collectLoginErrors(form);

    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const user = await store.getUserByEmail(form.email);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (user.password !== form.password) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials. Please try again.' });
    }

    const updated = await store.setUserLoginState(user.userId, true);
    const activeUser = updated || user;

    return res.status(200).json({ success: true, user: buildUserResponse(activeUser) });
  } catch (err) {
    next(err);
  }
});

router.post('/auth/logout-' + APP_ID, async function (req, res, next) {
  try {
    const idInput = sanitiseString(req.body && req.body.userId);
    const userId = idInput ? idInput.toUpperCase() : '';

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User identifier is required to log out.' });
    }

    const user = await store.getUserByUserId(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'Account not found for the supplied ID.' });
    }

    await store.setUserLoginState(userId, false);

    return res.status(200).json({ success: true, message: 'You have been logged out.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
