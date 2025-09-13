const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

// Get all Subscriptions
router.get("/{userId}/subscriptions", (req, res) => {
  // Logic to get all subscriptions for a user
});
// Get a single Subscription by ID
// Subscribe to a plan
// Upgrade/Downgrade a subscription
// Cancel a subscription

// Get all subscriptions for a user
router.get('/:userId/subscriptions', auth, async (req, res) => {
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
});

// Get specific subscription details
router.get('/:userId/subscriptions/:subscriptionId', auth, async (req, res) => {
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
});

// Subscribe to a plan
router.post('/:userId/subscriptions', auth, async (req, res) => {
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
});

// Upgrade/Downgrade subscription
router.put('/:userId/subscriptions/:subscriptionId', auth, async (req, res) => {
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
});

// Cancel subscription
router.delete('/:userId/subscriptions/:subscriptionId', auth, async (req, res) => {
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
});

// Get AI-based personalized recommendations
router.get('/:userId/recommendations', auth, async (req, res) => {
  try {
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get user's current subscription
    const currentSubscription = await Subscription.findOne({
      user: req.params.userId,
      status: 'active'
    }).populate('plan');

    // Get all available plans
    const allPlans = await Plan.find().sort({ price: 1 });

    // Simple recommendation algorithm based on usage
    let recommendations = [];
    
    if (currentSubscription) {
      const usagePercentage = (currentSubscription.usage.dataUsedGB / currentSubscription.usage.quotaGB) * 100;
      
      if (usagePercentage > 80) {
        // User is using most of their data, recommend higher quota plans
        recommendations = allPlans.filter(plan => 
          plan.dataQuotaGB > currentSubscription.plan.dataQuotaGB
        ).slice(0, 3);
      } else if (usagePercentage < 30) {
        // User is using little data, recommend cheaper plans
        recommendations = allPlans.filter(plan => 
          plan.price < currentSubscription.plan.price
        ).slice(0, 3);
      } else {
        // Recommend similar plans
        recommendations = allPlans.filter(plan => 
          plan.price >= currentSubscription.plan.price * 0.8 &&
          plan.price <= currentSubscription.plan.price * 1.2 &&
          plan._id.toString() !== currentSubscription.plan._id.toString()
        ).slice(0, 3);
      }
    } else {
      // No current subscription, recommend popular plans (cheapest and mid-range)
      recommendations = [
        allPlans[0], // Cheapest
        allPlans[Math.floor(allPlans.length / 2)], // Mid-range
        allPlans[allPlans.length - 1] // Most expensive
      ];
    }

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View available discounts
router.get('/:userId/discounts', auth, async (req, res) => {
  try {
    // Check if user is accessing their own data or is admin
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Simple discount system - in a real app, this would come from a database
    const discounts = [
      {
        code: 'WELCOME10',
        description: '10% off for new customers',
        discountPercent: 10,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        code: 'SUMMER25',
        description: '25% off summer special',
        discountPercent: 25,
        validUntil: new Date('2023-09-01')
      },
      {
        code: 'LOYALTY15',
        description: '15% off for loyal customers',
        discountPercent: 15,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      }
    ];

    res.json(discounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;