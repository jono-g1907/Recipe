const mongoose = require('mongoose');

// regex constants for exact format each string must follow
// basic email pattern
const EMAIL_REGEX = /^\S+@\S+\.\S+$/; 
// password must include lowercase, uppercase, number, and special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}:;"'<>?,.\/]).{8,}$/;
// allow letters, spaces, hyphens, apostrophes
const NAME_REGEX = /^[A-Za-z\s\-']{2,100}$/; 
// flexible pattern for international numbers
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/; 
// e.g. U-00001
const USER_ID_REGEX = /^U-\d{5}$/; 

// helper function used by defaults so we always get now when needed
function defaultToNow() {
  return new Date();
}

// schema for user accounts
const userSchema = new mongoose.Schema({
  // id we can expose to clients
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: USER_ID_REGEX
  },
  // contact email address and unique login identifier
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: EMAIL_REGEX
  },
  // raw password (for initial creation)
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const pwd = value || '';
        return PASSWORD_REGEX.test(pwd);
      },
      message: 'Password must be complex'
    }
  },
  // full name displayed within the app
  fullname: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    match: NAME_REGEX
  },
  // application role determines permissions
  role: {
    type: String,
    required: true,
    enum: ['admin', 'chef', 'manager']
  },
  // phone number used for contact or alerts
  phone: {
    type: String,
    required: true,
    trim: true,
    match: PHONE_REGEX
  },
  // simple flag we can toggle when the user is logged in
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  // timestamp recorded when the document is created
  createdAt: {
    type: Date,
    default: defaultToNow
  },
  // timestamp updated whenever we manually call save()
  updatedAt: {
    type: Date,
    default: defaultToNow
  }
}, {
  // let mongoose automatically manage createdAt/updatedAt as well
  timestamps: true
});


// pre-save hook keeps updatedAt updated every time we save the document
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// helpful indexes for quick lookups and uniqueness enforcement
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);