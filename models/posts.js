const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  caption: {
    type: String,
    trim: true
  },
  like: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    text: { type: String, trim: true },
    date: { type: Date, default: Date.now }
  }],
  date: {
    type: Date,
    default: Date.now
  },
  shares: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  }],
  postimage: String,
  approved: {
    type: Boolean,
    default: false
  }
});


module.exports = mongoose.model("post", postSchema);
