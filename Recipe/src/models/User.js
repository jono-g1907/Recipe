// Import mongoose to define the schema for users in MongoDB.
const mongoose = require('mongoose');

// Regular expressions define valid formats for different string fields.
const EMAIL_REGEX = /^\S+@\S+\.\S+$/; // Basic email pattern (not perfect, but effective).
// Password must include lowercase, uppercase, number, and special character.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}:;"'<>?,.\/]).{8,}$/;
// Stored passwords might already be hashed. This regex checks for bcrypt format.
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$.{53}$/;
const NAME_REGEX = /^[A-Za-z\s\-']{2,100}$/; // Allow letters, spaces, hyphens, apostrophes.
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/; // Flexible pattern for international numbers.
const USER_ID_REGEX = /^U-\d{5}$/; // Matches ids like "U-00001".

// Helper function used by defaults below so we always get "now" when needed.
function defaultToNow() {
  return new Date();
}

// Schema blueprint for user accounts.
const userSchema = new mongoose.Schema({
  // Human-readable id we can expose to clients.
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: USER_ID_REGEX
  },
  // Contact email address and unique login identifier.
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: EMAIL_REGEX
  },
  // Raw password (for initial creation) or bcrypt hash.
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (value) {
        const pwd = value || '';
        return PASSWORD_REGEX.test(pwd) || BCRYPT_REGEX.test(pwd);
      },
      message: 'Password must be complex or a bcrypt hash.'
    }
  },
  // Full name displayed within the app.
  fullname: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    match: NAME_REGEX
  },
  // Application role determines permissions (admin/chef/manager).
  role: {
    type: String,
    required: true,
    enum: ['admin', 'chef', 'manager']
  },
  // Phone number used for contact or alerts.
  phone: {
    type: String,
    required: true,
    trim: true,
    match: PHONE_REGEX
  },
  // Simple flag we can toggle when the user is online.
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  // Timestamp recorded when the document is created.
  createdAt: {
    type: Date,
    default: defaultToNow
  },
  // Timestamp updated whenever we manually call save().
  updatedAt: {
    type: Date,
    default: defaultToNow
  }
}, {
  // Let mongoose automatically manage createdAt/updatedAt as well.
  timestamps: true
});


// Pre-save hook keeps updatedAt fresh every time we save the document.
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Helpful indexes for quick lookups and uniqueness enforcement.
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ role: 1 });

// Export the model to interact with the "users" collection elsewhere.
module.exports = mongoose.model('User', userSchema);



