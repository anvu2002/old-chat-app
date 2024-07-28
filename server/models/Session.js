const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionID: String,
    userID: String,
    username: String,
    connected: Boolean,
});

module.exports = mongoose.model('Session', sessionSchema);
