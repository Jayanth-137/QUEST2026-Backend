const express = require('express');
const router = express.Router();
// const auth = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan'); 
const { getAllSubscriptions, getSubscriptionById, subscribe, updateSubscription, cancelSubscription } = require('../controllers/userControllers');

// Get all Subscriptions
router.get("/:userId/subscriptions", getAllSubscriptions);
// Get a single Subscription by ID
router.get('/:userId/subscriptions/:subscriptionId', getSubscriptionById);
// Subscribe to a plan
router.post('/:userId/subscriptions/:subscriptionId', subscribe);
// Upgrade/Downgrade a subscription
router.put('/:userId/subscriptions/:subscriptionId', updateSubscription);
// Cancel a subscription
router.delete('/:userId/subscriptions/:subscriptionId', cancelSubscription);

module.exports = router;