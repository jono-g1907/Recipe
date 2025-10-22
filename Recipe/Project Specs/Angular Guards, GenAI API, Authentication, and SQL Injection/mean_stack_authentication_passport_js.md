# MEAN Stack Authentication

In modern web applications, authentication can take a variety of forms. Traditionally, users log in by providing a username and password. With the rise of social networking, single sign-on using an OAuth provider such as Facebook or Twitter has become a popular authentication method. Services that expose an API often require token-based credentials to protect access. Several authentication libraries can be used to provide user management and authentication, such as PassportJS and Everyauth.

> **Note:** You can build your own database and a hashing algorithm (for passwords), or you can use User Management as a Service cloud platforms such as Okta and OneLogin.

In this section, we will use **PassportJS** as an example for authentication libraries.

---

## What is Passport.js?

Passport is an authentication middleware for Node.js. As it is extremely flexible and modular, Passport can be unobtrusively dropped into any Express-based web application. A comprehensive set of strategies supports authentication using a username and password, Facebook, Twitter, and more. Find out more about Passport on its official documentation.

### Features

- 500+ authentication strategies
- Single sign-on with OpenID and OAuth
- Easily handle success and failure
- Supports persistent sessions
- Dynamic scope and permissions
- Pick and choose the required strategies
- Implement custom strategies
- Does not mount routes in the application
- Lightweight code base

Now, we will examine four strategies provided by PassportJS: **Local**, **OpenID**, **Facebook**, and **Google**.

---

## Username & Password (Local)

The most widely used way for websites to authenticate users is via a username and password. Support for this mechanism is provided by the `passport-local` module.

### Install

```bash
npm install passport-local
```

```javascript
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));
```

The verify callback for local authentication accepts `username` and `password` arguments submitted to the application via a login form.

### Parameters

By default, `LocalStrategy` expects to find credentials in parameters named `username` and `password`. If your site prefers to name these fields differently, options are available to change the defaults.

```javascript
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'passwd'
  },
  function (username, password, done) {
    // ...
  }
));
```

### Route

The login form is submitted to the server via the `POST` method. Using `authenticate()` with the local strategy will handle the login request.

---

## OpenID

OpenID is an open standard for federated authentication. When visiting a website, users present their OpenID to sign in. The user then authenticates with their chosen OpenID provider, which issues an assertion to confirm the user's identity. The website verifies this assertion in order to sign the user in.

### Install

```bash
npm install passport-openid
```

### Configuration

When using OpenID, a **return URL** and **realm** must be specified. The `returnURL` is the URL to which the user will be redirected after authenticating with their OpenID provider. `realm` indicates the part of the URL-space for which authentication is valid. Typically, this will be the root URL of the website.

```javascript
const passport = require('passport');
const OpenIDStrategy = require('passport-openid').Strategy;

passport.use(new OpenIDStrategy({
    returnURL: 'http://www.example.com/auth/openid/return',
    realm: 'http://www.example.com/'
  },
  function (identifier, done) {
    User.findOrCreate({ openId: identifier }, function (err, user) {
      done(err, user);
    });
  }
));
```

---

## Facebook

The Facebook strategy allows users to log in to a web application using their Facebook account. Internally, Facebook authentication works using OAuth 2.0.

### Install

```bash
npm install passport-facebook
```

### Configuration

In order to use Facebook authentication, you must first create an app at **Facebook Developers**. When created, an app is assigned an **App ID** and **App Secret**. Your application must also implement a **redirect URL**, to which Facebook will redirect users after they have approved access for your application.

```javascript
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: 'http://www.example.com/auth/facebook/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    User.findOrCreate(/* ... */ , function (err, user) {
      if (err) { return done(err); }
      done(null, user);
    });
  }
));
```

### Routes

Two routes are required for Facebook authentication. The first route redirects the user to Facebook. The second route is the URL to which Facebook will redirect the user after they have logged in.

```javascript
// Redirect the user to Facebook for authentication. When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval. Finish the
// authentication process by attempting to obtain an access token. If
// access was granted, the user will be logged in. Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));
```

---

## Google

The Google strategy allows users to sign in to a web application using their Google account. Google used to support OpenID internally, but it now works based on OpenID Connect and supports OAuth 1.0 and OAuth 2.0.

### Install

```bash
npm install passport-google-oauth
```

### Configuration

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Use the GoogleStrategy within Passport.
// Strategies in Passport require a `verify` function, which accepts
// credentials (in this case, an accessToken, refreshToken, and Google
// profile), and invokes a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://www.example.com/auth/google/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));
```

### Routes

```javascript
// GET /auth/google
// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Google authentication will involve
// redirecting the user to google.com. After authorization, Google
// will redirect the user back to this application at /auth/google/callback
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

// GET /auth/google/callback
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function will be called,
// which, in this example, will redirect the user to the home page.
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  }
);
```

