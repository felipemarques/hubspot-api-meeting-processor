const mongoose = require('mongoose');
const { Schema } = mongoose;

// Default Dates Configuration
const DEFAULT_DATE = new Date(new Date().setFullYear(new Date().getFullYear() - 4));

/**
 * Domain Schema Definition
 */
const DomainSchema = new Schema(
  {
    customers: [
      {
        customerId: {
          type: Schema.Types.ObjectId,
          ref: 'Customer',
        },
        mailPreferences: {
          weeklyReport: { type: Boolean, default: true },
        },
        accessLevel: {
          type: String,
          default: 'creator',
          enum: ['creator', 'admin', 'member', 'viewer'],
        },
      },
    ],
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    company: {
      name: { type: String, required: true },
      website: { type: String, required: true },
    },
    apiKey: { type: String, required: true },
    customerDBName: { type: String, required: true },
    setup: { type: Boolean, default: false },
    integrations: {
      hubspot: {
        status: { type: Boolean, default: false },
        accounts: [
          {
            hubId: String,
            hubDomain: String,
            accessToken: String,
            refreshToken: String,
            lastPulledDate: { type: Date },
            lastPulledDates: {
              companies: { type: Date, default: DEFAULT_DATE },
              contacts: { type: Date, default: DEFAULT_DATE },
              deals: { type: Date, default: DEFAULT_DATE },
            },
          },
        ],
      },
    },
  },
  { minimize: false }
);

module.exports = mongoose.model('Domain', DomainSchema);
