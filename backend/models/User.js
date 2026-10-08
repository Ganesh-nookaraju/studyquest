// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Please add a username'],
      trim: true,
      maxlength: [30, 'Username cannot exceed 30 characters']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true, // Guarantees duplicate accounts cannot be created with same email
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    profileImage: {
      type: String,
      default: '' // Placeholder for user avatars
    }
  },
  {
    timestamps: true // Automatically creates createdAt and updatedAt fields
  }
);

// Collation indexes for high-performance case-insensitive lookups on login and signup
UserSchema.index({ username: 1 }, { collation: { locale: 'en', strength: 2 } });
UserSchema.index({ email: 1 }, { collation: { locale: 'en', strength: 2 } });


// Pre-save Middleware: Hashing password before database insertion
UserSchema.pre('save', async function (next) {
  // Only hash password if it was modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate bcrypt salt round index
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Helper Method: Compare submitted login password with hashed database password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
