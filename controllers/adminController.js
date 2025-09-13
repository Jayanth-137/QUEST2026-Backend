const Subscription = require('../models/Subscription');

// GET /admin/subscriptions - View all subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate('userId', 'name email');
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// PUT /admin/subscriptions/:subscriptionId - Manage subscription
exports.updateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const updated = await Subscription.findByIdAndUpdate(subscriptionId, req.body, { new: true });
    if (!updated) return res.status(404).json({ msg: 'Subscription not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// GET /admin/dashboard/top-plans - View dashboard top plans
exports.getTopPlans = async (req, res) => {
  try {
    const topPlans = await Subscription.aggregate([
      { $group: { _id: '$planName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    res.json(topPlans);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
