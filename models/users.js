const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  fullname: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true
  },
  password: {
    type: String,
    unique: true
  },
  profileimage: {
    type: String,
    default: ""
  },
  contact: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  graduationyear: {
    type: String,
    trim: true
  },
  currentorganisation: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "post"
  }]
}, {
  timestamps: true
})

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);