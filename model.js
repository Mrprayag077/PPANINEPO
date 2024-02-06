// Import Mongoose
const mongoose = require('mongoose');

// Define Task schema
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    due_date: {
        type: String,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task', // Reference to the User model
    },
    status: {
        type: Number,
        // enum: ['TODO', 'IN_PROGRESS', 'DONE'],
        // default: 'TODO'
    },
    priority: {
        type: Number,
        // default: 0
    },
    created_at: {
        type: Date,
        // default: Date.now
    },
    updated_at: {
        type: Date,
        // default: Date.now
    },
    username: {
        type: String,
    },
    password: {
        type: String,
    },
    userid: {
        type: String,
    },
    deleted_at: {
        type: Date,
    },

    task_id: {
        type: String,
    },
    phone_number: {
        type: Number,
    },
    docx_type: {
        type: String,
    }
});

// Create Task model
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;



