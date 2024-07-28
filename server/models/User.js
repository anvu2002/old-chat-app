const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  sessionID: String,
  userID: String,
  username: String,
  connected: Boolean,
});

module.exports = mongoose.model('User', userSchema);
