// Custom error type we throw when a user's input does not meet validation rules.
const ValidationError = require('../../errors/ValidationError');
// Helper that normalises unknown errors into a predictable shape.
const normaliseError = require('../../lib/normaliseError');
// Form helpers keep the parsing/validation logic in one place so the route stays readable.
const {
  parseRegistrationForm,
  collectRegistrationErrors,
  buildRegistrationValues,
  parseLoginForm,
  collectLoginErrors
} = require('../../forms/userForm');
// Sanitising removes potentially dangerous characters from text before using it in HTML.
const { sanitiseString } = require('../../lib/utils');
// Predefined list of user roles we allow on the registration page.
const { ROLE_OPTIONS } = require('../../lib/validationConstants');

function registerAuthRoutes(app, dependencies) {
  // The data store is injected so we can swap in a fake version for tests.
  const store = dependencies.store;
  const appId = dependencies.appId;

  // Show the registration page with empty default values.
  app.get('/register-' + appId, function (req, res) {
    const values = { email: '', fullname: '', role: 'chef', phone: '' };
    res.render('register-31477046.html', {
      error: '',
      values: values,
      roles: ROLE_OPTIONS
    });
  });

  // Handle form submissions for new registrations.
  app.post('/register-' + appId, async function (req, res, next) {
    try {
      // Parse and validate the incoming form data.
      const form = parseRegistrationForm(req.body || {});
      const errors = collectRegistrationErrors(form);

      if (!errors.length) {
        // Make sure the email address is unique before creating the account.
        const existing = await store.getUserByEmail(form.email);
        if (existing) {
          errors.push('That email address is already registered');
        }
      }

      if (errors.length) {
        // Re-render the page with the user's inputs and a helpful error message.
        const values = buildRegistrationValues(form);
        return res.status(400).render('register-31477046.html', {
          error: errors.join(' '),
          values: values,
          roles: ROLE_OPTIONS
        });
      }

      // Persist the new user record to the data store.
      await store.createUser({
        email: form.email,
        password: form.password,
        fullname: form.fullname,
        role: form.role,
        phone: form.phone
      });

      // Redirect to the login page so the user can sign in straight away.
      return res.redirect(302, '/login-' + appId + '?registered=' + encodeURIComponent(form.email));
    } catch (err) {
      const normalised = normaliseError(err);
      if (normalised instanceof ValidationError) {
        // Show any field-level validation errors triggered in the data layer.
        const retryForm = parseRegistrationForm(req.body || {});
        const values = buildRegistrationValues(retryForm);
        const message = normalised.errors && normalised.errors.length ? normalised.errors.join(' ') : 'Registration failed';
        return res.status(400).render('register-31477046.html', {
          error: message,
          values: values,
          roles: ROLE_OPTIONS
        });
      }
      next(err);
    }
  });

  // Render the login page. Depending on query params we may show success/error notices.
  app.get('/login-' + appId, function (req, res) {
    const registered = sanitiseString(req.query && req.query.registered);
    const infoMessage = registered
      ? 'Registration successful. You can now log in with ' + registered
      : sanitiseString(req.query && req.query.message);
    const successMessage = registered ? '' : sanitiseString(req.query && req.query.success);
    const errorMessage = sanitiseString(req.query && req.query.error);
    const emailValue = registered || sanitiseString(req.query && req.query.email) || '';

    res.render('login-31477046.html', {
      message: infoMessage || '',
      error: errorMessage || '',
      success: successMessage || '',
      email: emailValue
    });
  });

  // Handle login form submissions.
  app.post('/login-' + appId, async function (req, res, next) {
    try {
      const form = parseLoginForm(req.body || {});
      const errors = collectLoginErrors(form);

      if (errors.length) {
        // If the user forgot to fill out required fields, prompt them to try again.
        return res.status(400).render('login-31477046.html', {
          message: '',
          error: errors.join(' '),
          success: '',
          email: form.email
        });
      }

      // Attempt to find a matching user record by email.
      const user = await store.getUserByEmail(form.email);

      if (!user) {
        return res.status(404).render('login-31477046.html', {
          message: '',
          error: 'Account not found.',
          success: '',
          email: form.email
        });
      }

      // Passwords are plain-text here for simplicity, so just compare them directly.
      if (user.password !== form.password) {
        return res.status(401).render('login-31477046.html', {
          message: '',
          error: 'Invalid credentials. Please try again.',
          success: '',
          email: form.email
        });
      }

      // Mark the user as logged in so the dashboard knows who they are.
      const updated = await store.setUserLoginState(user.userId, true);
      const activeUser = updated || user;

      return res.redirect(302, '/home-' + appId + '?userId=' + encodeURIComponent(activeUser.userId) + '&success=1');
    } catch (err) {
      next(err);
    }
  });

  // Logging out is triggered from a form button so we accept POST requests here.
  app.post('/logout-' + appId, async function (req, res, next) {
    try {
      const idInput = sanitiseString(req.body && req.body.userId);
      const userId = idInput ? idInput.toUpperCase() : '';

      if (!userId) {
        return res.redirect(302, '/login-' + appId + '?error=' + encodeURIComponent('User identifier is required to log out.'));
      }

      // Look up the user so we can flip their login state back to false.
      const user = await store.getUserByUserId(userId);

      if (!user) {
        return res.redirect(302, '/login-' + appId + '?error=' + encodeURIComponent('Account not found for the supplied ID.'));
      }

      await store.setUserLoginState(userId, false);

      return res.redirect(302, '/login-' + appId + '?success=' + encodeURIComponent('You have been logged out.') + '&email=' + encodeURIComponent(user.email));
    } catch (err) {
      next(err);
    }
  });
}

module.exports = registerAuthRoutes;
