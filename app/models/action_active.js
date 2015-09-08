// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('ActiveAction', new Schema({
    Action: Object,           // ID of action
    Start: Date,                // Date
    Finish: Date,               // Date
    Status: String,             // Waiting, Pending, FinishedOK, FinishedERROR
    ReturnValue: String,        // ReturnValue on finish
}));

