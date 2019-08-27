var mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comment: {
        type: String,
        required: true
    }
},{
    timestamps: true
});

const FileSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{ timestamps: true });

const TaskSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    weightage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    end_date: {
        type: Date,
        required: true
    },
    actual_start_date: {
        type: Date,
        default: Date.now
    },
    actual_end_date: {
        type: Date,
        default: null
    },
    completion: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    review_date: {
        type: Date,
        default: null
    },
    next_review_date: {
        type: Date,
        default: null
    },
    expected_completion: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    comments: [CommentSchema],
    files: [FileSchema]
},{
    timestamps: true
});

const Project = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    short_name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    start_date: {
        type: Date,
        default: Date.now
    },
    fat_date: {
        type: Date,
        required: true
    },
    actual_end: {
        type: Date,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    tasks: [TaskSchema]
},{
    timestamps: true
});
module.exports = mongoose.model('Project', Project);