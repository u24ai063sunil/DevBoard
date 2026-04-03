const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'on-hold'],
      default: 'active',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId, // reference to User document
      ref: 'User',                          // tells Mongoose which model to populate
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['viewer', 'editor', 'admin'],
          default: 'viewer',
        },
      },
    ],
    dueDate: {
      type: Date,
    },
    tags: [String], // array of strings e.g. ['frontend', 'urgent']
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },   // include virtual fields in JSON output
    toObject: { virtuals: true },
  }
);

// ── Virtual field: taskCount ──────────────────────────────────────
// Virtual fields are computed — not stored in DB
// This gets populated only when explicitly requested
projectSchema.virtual('tasks', {
  ref: 'Task',           // model to reference
  localField: '_id',     // project's _id
  foreignField: 'project', // matches Task.project field
});

// ── Index for faster queries ──────────────────────────────────────
projectSchema.index({ owner: 1, status: 1 }); // compound index
projectSchema.index({ name: 'text', description: 'text' }); // text search index

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;