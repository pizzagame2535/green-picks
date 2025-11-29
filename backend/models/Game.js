const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    imageUrl: { type: String, required: true },
    winRate: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Game', gameSchema);
