const AnalyticsService = require('../services/AnalyticService');

const AnalyticsController = {

  // Doanh thu theo tuần
  async revenueByWeek(req, res) {
    try {
      const { year, week } = req.query;

      if (!year || !week) {
        return res.status(400).json({
          message: 'year and week are required'
        });
      }

      const data = await AnalyticsService.revenueByWeek(
        Number(year),
        Number(week)
      );

      res.json({
        period: 'week',
        year: Number(year),
        week: Number(week),
        ...data
      });
    } catch (err) {
      console.error('Analytics revenueByWeek error:', err);
      res.status(500).json({ message: 'internal_server_error' });
    }
  },

  // Doanh thu theo tháng
  async revenueByMonth(req, res) {
    try {
      const { year, month } = req.query;

      if (!year || !month) {
        return res.status(400).json({
          message: 'year and month are required'
        });
      }

      const data = await AnalyticsService.revenueByMonth(
        Number(year),
        Number(month)
      );

      res.json({
        period: 'month',
        year: Number(year),
        month: Number(month),
        ...data
      });
    } catch (err) {
      console.error('Analytics revenueByMonth error:', err);
      res.status(500).json({ message: 'internal_server_error' });
    }
  },

  // Doanh thu theo năm
  async revenueByYear(req, res) {
    try {
      const { year } = req.query;

      if (!year) {
        return res.status(400).json({
          message: 'year is required'
        });
      }

      const data = await AnalyticsService.revenueByYear(Number(year));

      res.json({
        period: 'year',
        year: Number(year),
        ...data
      });
    } catch (err) {
      console.error('Analytics revenueByYear error:', err);
      res.status(500).json({ message: 'internal_server_error' });
    }
  },

  // Chart doanh thu theo ngày
  async revenueChartByDay(req, res) {
    try {
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          message: 'start_date and end_date are required'
        });
      }

      const data = await AnalyticsService.revenueChartByDay(
        new Date(start_date),
        new Date(end_date)
      );

      res.json({
        period: 'day',
        start_date,
        end_date,
        data
      });
    } catch (err) {
      console.error('Analytics revenueChartByDay error:', err);
      res.status(500).json({ message: 'internal_server_error' });
    }
  },

  // Chart doanh thu theo tháng
  async revenueChartByMonth(req, res) {
    try {
      const { year } = req.query;

      if (!year) {
        return res.status(400).json({
          message: 'year is required'
        });
      }

      const data = await AnalyticsService.revenueChartByMonth(Number(year));

      res.json({
        period: 'month',
        year: Number(year),
        data
      });
    } catch (err) {
      console.error('Analytics revenueChartByMonth error:', err);
      res.status(500).json({ message: 'internal_server_error' });
    }
  },

  // Chart doanh thu theo năm
  async revenueChartByYear(req, res) {
    try {
      const data = await AnalyticsService.revenueChartByYear();

      res.json({
        period: 'year',
        data
      });
    } catch (err) {
      console.error('Analytics revenueChartByYear error:', err);
      res.status(500).json({ message: 'internal_server_error' });
    }
  }
};

module.exports = AnalyticsController;
