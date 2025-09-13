const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middlewares/authMiddleware"); // optional, for admin protection
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/adminController');

// Plan management routes
router.get('/plans', getAllPlans);
router.get('/plans/:planId', getPlanById);
router.post('/plans', createPlan);
router.put('/plans/:planId', updatePlan);
router.delete('/plans/:planId', deletePlan);
// Routes
router.get("/subscriptions", adminController.getAllSubscriptions);
router.put(
  "/subscriptions/:subscriptionId",
  adminController.updateSubscription
);
router.get("/dashboard/top-plans", adminController.getTopPlans);

module.exports = router;
