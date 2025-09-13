const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

// Get all subscriptions for a user
const getAllSubscriptions = async (req, res) => {
  try {
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subscriptions = await Subscription.find({ user: req.params.userId })
      .populate('plan', 'name price speedMbps dataQuotaGB features')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific subscription details
const getSubscriptionById = async (req, res) => {
// router.get('/:userId/subscriptions/:subscriptionId', auth, async (req, res) => {
  try {
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subscription = await Subscription.findOne({
      _id: req.params.subscriptionId,
      user: req.params.userId
    }).populate('plan', 'name price speedMbps dataQuotaGB features');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Subscribe to a plan
const subscribe = async (req, res) => {
  try {
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { planId, autoRenew } = req.body;

    // Check if plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Check if user already has an active subscription for this plan
    const existingSubscription = await Subscription.findOne({
      user: req.params.userId,
      plan: planId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'You already have an active subscription for this plan' });
    }

    // Calculate end date (30 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    // Create new subscription
    const subscription = new Subscription({
      user: req.params.userId,
      plan: planId,
      autoRenew: autoRenew || false,
      endDate,
      usage: {
        dataUsedGB: 0,
        quotaGB: plan.dataQuotaGB
      }
    });

    await subscription.save();
    
    // Populate plan details before sending response
    await subscription.populate('plan', 'name price speedMbps dataQuotaGB features');
    
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upgrade/Downgrade subscription
const updateSubscription = async (req, res) => {
// router.put('/:userId/subscriptions/:subscriptionId', auth, async (req, res) => {
  try {
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { planId } = req.body;

    // Check if new plan exists
    const newPlan = await Plan.findById(planId);
    if (!newPlan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Find the subscription
    const subscription = await Subscription.findOne({
      _id: req.params.subscriptionId,
      user: req.params.userId
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update the subscription
    subscription.plan = planId;
    subscription.usage.quotaGB = newPlan.dataQuotaGB;
    
    await subscription.save();
    
    // Populate plan details before sending response
    await subscription.populate('plan', 'name price speedMbps dataQuotaGB features');
    
    res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
// router.delete('/:userId/subscriptions/:subscriptionId', auth, async (req, res) => {
  try {
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subscription = await Subscription.findOne({
      _id: req.params.subscriptionId,
      user: req.params.userId
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Mark as cancelled instead of actually deleting
    subscription.status = 'cancelled';
    subscription.autoRenew = false;
    
    await subscription.save();
    
    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllSubscriptions, getSubscriptionById, subscribe, updateSubscription, cancelSubscription };