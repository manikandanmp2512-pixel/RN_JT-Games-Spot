const mongoose = require("mongoose");

const AdRevenueReportSchema = new mongoose.Schema(
  {
    reportKey: {
      type: String,
      required: true,
      unique: true,
    },

    network: {
      type: String,
      required: true,
      default: "admob",
    },

    reportDate: {
      type: Date,
      required: true,
    },

    estimatedRevenue: {
      type: Number,
      min: 0,
      default: 0,
    },

    finalizedRevenue: {
      type: Number,
      min: 0,
      default: 0,
    },

    paidRevenue: {
      type: Number,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: "USD",
    },

    source: {
      type: String,
      enum: ["provider_report", "manual_reconciliation"],
      default: "provider_report",
    },
  },
  {
    timestamps: true,
  }
);

AdRevenueReportSchema.index({
  network: 1,
  reportDate: -1,
});

module.exports = mongoose.model(
  "AdRevenueReport",
  AdRevenueReportSchema
);