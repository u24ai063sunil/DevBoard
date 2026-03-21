const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    refreshTokens: [String], // store active refresh tokens for logout-all support
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true, // auto-adds createdAt and updatedAt fields
  }
);

// ── Pre-save hook: hash password before saving ──────────────────────
userSchema.pre('save', async function () {
  console.log('PRE-SAVE HOOK FIRED');
  console.log('isModified:', this.isModified('password'));
  console.log('this context:', typeof this);
  
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