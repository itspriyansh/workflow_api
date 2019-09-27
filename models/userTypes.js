var mongoose = require('mongoose');

const UserType = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location_enable: {
        type: Boolean,
        default: false
    },
    location_view: {
        type: Boolean,
        default: false
    },
    upload: {
        type: Boolean,
        default: false
    },
    comments: {
        type: Boolean,
        default: false
    },
    data_entry: {
        type: Boolean,
        default: false
    },
    file_access: {
        type: Boolean,
        default: false
    },
    download: {
        type: Boolean,
        default: false
    },
    offer_details: {
        type: Boolean,
        default: false
    }
});
module.exports = mongoose.model('UserType', UserType);