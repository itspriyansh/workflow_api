var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
require('mongoose-type-email');

var User = mongoose.Schema({
    usertype: {
        type: 'String',
        default: 'User Operator'
    },
    firstname: {
        type: 'String',
        required: true
    },
    lastname: {
        type: 'String',
        default: ''
    }
},{
    timestamps: true,
    toObject: {virtuals: true},
    toJSON: {virtuals: true}
});

User.plugin(passportLocalMongoose);

User.virtual('type', {
    ref: 'UserType',
    localField: 'usertype',
    foreignField: 'name',
    justOne: true
});

module.exports = mongoose.model('User', User);