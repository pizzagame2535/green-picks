const mongoose = require('mongoose');

const lotteryItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['HANOI', 'LAOS', 'THAI'],
      required: true
    },
    imageUrl: { type: String, required: true },
    caption: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LotteryItem', lotteryItemSchema);
