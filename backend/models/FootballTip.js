const mongoose = require('mongoose');

const footballTipSchema = new mongoose.Schema(
  {
    // เดิมอาจมี field อื่นอยู่แล้ว ไม่ต้องลบก็ได้
    imageUrl: String,
    confidence: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model('FootballTip', footballTipSchema);
