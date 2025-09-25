const ValidationError = require('../../errors/ValidationError');
const normaliseError = require('../../lib/normaliseError');
const {
  parseRegistrationForm,
  collectRegistrationErrors,
  buildRegistrationValues,
  parseLoginForm,
  collectLoginErrors
} = require('../../forms/userForm');
const { sanitiseString } = require('../../lib/utils');
const { ROLE_OPTIONS } = require('../../lib/validationConstants');

function registerAuthRoutes(app, dependencies) {
  const store = dependencies.store;
  const appId = dependencies.appId;

  app.get('/register-' + appId, function (req, res) {
    const values = { email: '', fullname: '', role: 'chef', phone: '' };
    res.render('register-31477046.html', {
      error: '',
      values: values,
      roles: ROLE_OPTIONS
    });
  });

  app.post('/register-' + appId, async function (req, res, next) {
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
        const values = buildRegistrationValues(form);
        return res.status(400).render('register-31477046.html', {
          error: errors.join(' '),
          values: values,
          roles: ROLE_OPTIONS
        });
      }

      await store.createUser({
        email: form.email,
        password: form.password,
        fullname: form.fullname,
        role: form.role,
        phone: form.phone
      });

      return res.redirect(302, '/login-' + appId + '?registered=' + encodeURIComponent(form.email));
    } catch (err) {
      const normalised = normaliseError(err);
      if (normalised instanceof ValidationError) {
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

  app.post('/login-' + appId, async function (req, res, next) {
    try {
      const form = parseLoginForm(req.body || {});
      const errors = collectLoginErrors(form);

      if (errors.length) {
        return res.status(400).render('login-31477046.html', {
          message: '',
          error: errors.join(' '),
          success: '',
          email: form.email
        });
      }

      const user = await store.getUserByEmail(form.email);

      if (!user) {
        return res.status(404).render('login-31477046.html', {
          message: '',
          error: 'Account not found.',
          success: '',
          email: form.email
        });
      }

      if (user.password !== form.password) {
        return res.status(401).render('login-31477046.html', {
          message: '',
          error: 'Invalid credentials. Please try again.',
          success: '',
          email: form.email
        });
      }

      const updated = await store.setUserLoginState(user.userId, true);
      const activeUser = updated || user;

      return res.redirect(302, '/home-' + appId + '?userId=' + encodeURIComponent(activeUser.userId) + '&success=1');
    } catch (err) {
      next(err);
    }
  });

  app.post('/logout-' + appId, async function (req, res, next) {
    try {
      const idInput = sanitiseString(req.body && req.body.userId);
      const userId = idInput ? idInput.toUpperCase() : '';

      if (!userId) {
        return res.redirect(302, '/login-' + appId + '?error=' + encodeURIComponent('User identifier is required to log out.'));
      }

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
