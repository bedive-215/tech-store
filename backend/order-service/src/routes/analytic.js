const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/AnalyticController');

/**
 * Revenue analytics
 */

// Tổng doanh thu
router.get('/revenue/week', AnalyticsController.revenueByWeek);
router.get('/revenue/month', AnalyticsController.revenueByMonth);
router.get('/revenue/year', AnalyticsController.revenueByYear);

// Chart
router.get('/revenue/chart/day', AnalyticsController.revenueChartByDay);
router.get('/revenue/chart/month', AnalyticsController.revenueChartByMonth);
router.get('/revenue/chart/year', AnalyticsController.revenueChartByYear);

module.exports = router;
