const mongoose = require('mongoose');

//Define a schema
const Schema = mongoose.Schema;

const PostSchema = new Schema(
  {
    text: {
      type: String,
      required: true
    },
    trackingId: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      requied: true,
      default: 'Pending approval'
    },
    feedback: {
      type: String
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model('Post', PostSchema, 'Post');
