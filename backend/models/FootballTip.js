const mongoose = require('mongoose');

const footballTipSchema = new mongoose.Schema(
  {
    league: { type: String, required: true },
    matchTime: { type: String, required: true },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    pick: { type: String, required: true },
    confidence: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FootballTip', footballTipSchema);
