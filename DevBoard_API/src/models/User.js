const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,         // creates a DB index automatically
      lowercase: true,      // always store emails in lowercase
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,        // NEVER include password in query results by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'], // RBAC — only these two values allowed
      default: 'user',
    },
    avatar: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken:   String,
    emailVerificationExpires: Date,
    refreshTokens: [String], // store active refresh tokens for logout-all support
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt fields
  }
);
// Add this instance method before the model creation
userSchema.methods.createPasswordResetToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex')

  // Hash it before storing in DB — never store plain tokens
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Expires in 15 minutes
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000

  // Return unhashed token — this goes in the email link
  return resetToken
}

userSchema.methods.createEmailVerificationToken = function () {
  const verifyToken = crypto.randomBytes(32).toString('hex')

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verifyToken)
    .digest('hex')

  // Expires in 24 hours
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000

  return verifyToken
}

// ── Pre-save hook: hash password before saving ──────────────────────
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// ── Instance method: compare entered password with hashed one ───────
userSchema.methods.comparePassword = async function (candidatePassword) {
  // 'this.password' needs select: false bypassed — call with .select('+password')
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: check if password changed after JWT was issued ─
userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
    return jwtTimestamp < changedTimestamp; // true = password changed after token
  }
  return false;
};

const User = mongoose.model('User', userSchema);
module.exports = User;