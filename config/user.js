const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  token: String,
  waiting: Boolean,
  username: String
});

module.exports = mongoose.model("user", UserSchema);