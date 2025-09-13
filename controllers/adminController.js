const Subscription = require('../models/Subscription');

// GET /admin/subscriptions - View all subscriptions
getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate('userId', 'name email');
    res.json(subscriptions);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// PUT /admin/subscriptions/:subscriptionId - Manage subscription
updateSubscription = async (req, res) => {
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
getTopPlans = async (req, res) => {
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

const Plan = require('../models/Plan');
const { get } = require('mongoose');

// Get all plans
const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching plans',
      error: error.message
    });
  }
};

// Get plan details by ID
const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching plan',
      error: error.message
    });
  }
};

// Create a new plan
const createPlan = async (req, res) => {
  try {
    const { name, description, price, speedMbps, dataQuotaGB, features, autoRenew } = req.body;
    
    // Validation
    if (!name || !price || !speedMbps || !dataQuotaGB) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, speedMbps, and dataQuotaGB are required fields'
      });
    }
    
    // Check if plan with same name already exists
    const existingPlan = await Plan.findOne({ name });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'A plan with this name already exists'
      });
    }
    
    // Create new plan
    const newPlan = new Plan({
      name,
      description: description || '',
      price,
      speedMbps,
      dataQuotaGB,
      features: features || [],
      autoRenew: autoRenew !== undefined ? autoRenew : true
    });
    
    const savedPlan = await newPlan.save();
    
    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: savedPlan
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating plan',
      error: error.message
    });
  }
};

// Update a plan
const updatePlan = async (req, res) => {
  try {
    const { name, description, price, speedMbps, dataQuotaGB, features, autoRenew } = req.body;
    
    // Find the plan
    const plan = await Plan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Check if new name conflicts with other plans
    if (name && name !== plan.name) {
      const existingPlan = await Plan.findOne({ name, _id: { $ne: req.params.planId } });
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Another plan with this name already exists'
        });
      }
    }
    
    // Update fields
    if (name) plan.name = name;
    if (description !== undefined) plan.description = description;
    if (price !== undefined) plan.price = price;
    if (speedMbps !== undefined) plan.speedMbps = speedMbps;
    if (dataQuotaGB !== undefined) plan.dataQuotaGB = dataQuotaGB;
    if (features !== undefined) plan.features = features;
    if (autoRenew !== undefined) plan.autoRenew = autoRenew;
    
    const updatedPlan = await plan.save();
    
    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: updatedPlan
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating plan',
      error: error.message
    });
  }
};

// Delete a plan
const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Check if plan is being used by any subscriptions
    // You might want to add this check if you have subscription references
    // const subscriptionCount = await Subscription.countDocuments({ plan: req.params.planId });
    // if (subscriptionCount > 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Cannot delete plan as it is being used by existing subscriptions'
    //   });
    // }
    
    await Plan.findByIdAndDelete(req.params.planId);
    
    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting plan',
      error: error.message
    });
  }
};

module.exports = {
  getAllSubscriptions,
  updateSubscription,
  getTopPlans,
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};