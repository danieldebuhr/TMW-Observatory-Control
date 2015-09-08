// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Action', new Schema({
    DeviceID: String,
    APILinkID: String,
    ActionName: String,
    ActionDisplayName: String,
    Duration: Number,           // Expected duration in seconds
    ExpectedOkValue: String,    // Value, we expect on ok
    DisplayNameParameter1: String,
    DisplayNameParameter2: String
}));

