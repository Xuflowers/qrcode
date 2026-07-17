const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    certNo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    status: {
        type: String,
        required: true,
        trim: true,
        default: '有效',
    },
    clientName: {
        type: String,
        required: true,
        trim: true,
    },
    producerNameAndAddr: {
        type: String,
        required: true,
        trim: true,
    },
    manufacturerNameAndAddr: {
        type: String,
        required: true,
        trim: true,
    },
    products: {
        type: [String],
        required: true,
        default: [],
    },
    techonolgy: {
        type: [String],
        required: true,
        default: [],
    },
}, {
    timestamps: true,
});

certificateSchema.index({ certNo: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);