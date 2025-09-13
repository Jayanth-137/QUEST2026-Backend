const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middlewares/authMiddleware"); // optional, for admin protection

// Routes
router.get("/subscriptions", adminController.getAllSubscriptions);
router.put(
  "/subscriptions/:subscriptionId",
  adminController.updateSubscription
);
router.get("/dashboard/top-plans", adminController.getTopPlans);

module.exports = router;
