const mongoose = require('mongoose');

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}:;"'<>?,.\/]).{8,}$/;
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$.{53}$/;
const NAME_REGEX = /^[A-Za-z\s\-']{2,100}$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
const USER_ID_REGEX = /^U-\d{5}$/;

function defaultToNow() {
  return new Date();
}

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: USER_ID_REGEX
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: EMAIL_REGEX
  },
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
  fullname: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    match: NAME_REGEX
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'chef', 'manager']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: PHONE_REGEX
  },
  createdAt: {
    type: Date,
    default: defaultToNow
  },
  updatedAt: {
    type: Date,
    default: defaultToNow
  }
}, {
  timestamps: true
});


userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);



