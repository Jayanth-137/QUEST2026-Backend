const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  speedMbps: {
    type: Number,
    required: true
  },
  dataQuotaGB: {
    type: Number,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  features: [
    {
      type: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);
