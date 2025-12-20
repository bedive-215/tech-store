const OrderRepository = require('../repositories/OrderRepository');

const AnalyticsService = {

  async revenueByDateRange(startDate, endDate) {
    const rows = await OrderRepository.findPaidOrdersByDateRange(
      startDate,
      endDate
    );

    const totalRevenue = rows.reduce(
      (sum, r) => sum + Number(r.final_price),
      0
    );

    return {
      total_revenue: totalRevenue,
      total_orders: rows.length
    };
  },

  async revenueByWeek(year, week) {
    const startDate = new Date(year, 0, 1 + (week - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59);

    return this.revenueByDateRange(startDate, endDate);
  },

  async revenueByMonth(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return this.revenueByDateRange(startDate, endDate);
  },

  async revenueByYear(year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    return this.revenueByDateRange(startDate, endDate);
  },

  async revenueChartByDay(startDate, endDate) {
    return OrderRepository.revenueByDay(startDate, endDate);
  },

  async revenueChartByMonth(year) {
    return OrderRepository.revenueByMonth(year);
  },

  async revenueChartByYear() {
    return OrderRepository.revenueByYear();
  }
};

module.exports = AnalyticsService;
