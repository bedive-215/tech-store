import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { useOrder } from "@/providers/OrderProvider";

export default function DashboardAdmin() {
  // Lấy token từ localStorage
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  
  const {
    orders,
    analytics,
    fetchAllOrders,
    fetchRevenueByWeek,
    fetchRevenueByMonth,
    fetchRevenueByYear,
    fetchRevenueChartByDay,
    fetchRevenueChartByMonth,
    fetchRevenueChartByYear,
    loading,
  } = useOrder();

  // State cho filters
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentWeek = getWeekNumber(new Date());

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [chartType, setChartType] = useState("month");
  const [dateRange, setDateRange] = useState({
    start_date: getLastWeekDate(),
    end_date: getTodayDate(),
  });

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fetch data theo chart type được chọn
  useEffect(() => {
    loadChartData();
  }, [chartType, selectedYear, dateRange.start_date, dateRange.end_date]);

  // ====================================================
  // LOAD DATA FUNCTIONS
  // ====================================================

  const loadDashboardData = async () => {
    try {
      // Load tất cả data song song
      await Promise.allSettled([
        fetchAllOrders({ limit: 10, sort: "-created_at" }, token),
        fetchRevenueByWeek({ year: currentYear, week: currentWeek }, token),
        fetchRevenueByMonth({ year: currentYear, month: currentMonth }, token),
        fetchRevenueByYear({ year: currentYear }, token),
        fetchRevenueChartByMonth({ year: currentYear }, token),
      ]);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  const loadChartData = async () => {
    console.log('=== Loading Chart Data ===');
    console.log('Chart Type:', chartType);
    
    try {
      switch (chartType) {
        case "day":
          console.log('Fetching chart by day:', dateRange);
          await fetchRevenueChartByDay(
            {
              start_date: dateRange.start_date,
              end_date: dateRange.end_date,
            },
            token
          );
          break;
        case "month":
          console.log('Fetching chart by month, year:', selectedYear);
          await fetchRevenueChartByMonth({ year: selectedYear }, token);
          break;
        case "year":
          console.log('Fetching chart by year');
          const result = await fetchRevenueChartByYear({}, token);
          console.log('Chart by year result:', result);
          break;
      }
    } catch (error) {
      console.error("Error loading chart:", error);
    }
  };

  // ====================================================
  // DATA PROCESSING FUNCTIONS
  // ====================================================

  // Convert string to number safely
  const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Process chart data với validation đầy đủ
  const getChartData = () => {
    try {
      let rawData = [];
      let processedData = [];
      
      switch (chartType) {
        case "day":
          // Xử lý nhiều format data có thể
          const dayData = analytics.chartByDay;
          rawData = dayData?.data || (Array.isArray(dayData) ? dayData : []);
          
          console.log('Day Data Full:', dayData);
          console.log('Day Raw Data:', rawData);
          
          processedData = rawData
            .filter(item => item.date || item.day || item._id)
            .map((item) => ({
              name: formatDate(item.date || item.day || item._id),
              revenue: toNumber(item.total_revenue || item.revenue),
              orders: toNumber(item.total_orders || item.orders),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
          break;

        case "month":
          // Xử lý nhiều format data có thể
          const monthData = analytics.chartByMonth;
          rawData = monthData?.data || (Array.isArray(monthData) ? monthData : []);
          
          console.log('Month Data Full:', monthData);
          console.log('Month Raw Data:', rawData);
          
          // Tạo dữ liệu đầy đủ cho 12 tháng
          const monthsMap = new Map();
          
          // Đưa data từ API vào map
          rawData
            .filter(item => {
              const month = item.month || item._id;
              return month !== null && month !== undefined;
            })
            .forEach((item) => {
              const month = item.month || item._id;
              monthsMap.set(Number(month), {
                revenue: toNumber(item.total_revenue || item.revenue),
                orders: toNumber(item.total_orders || item.orders),
              });
            });
          
          // Tạo mảng đầy đủ 12 tháng
          processedData = Array.from({ length: 12 }, (_, i) => {
            const monthNum = i + 1;
            const data = monthsMap.get(monthNum) || { revenue: 0, orders: 0 };
            return {
              name: `Tháng ${monthNum}`,
              monthNumber: monthNum,
              revenue: data.revenue,
              orders: data.orders,
            };
          });
          break;

        case "year":
          // Xử lý nhiều format data có thể
          const yearData = analytics.chartByYear;
          rawData = yearData?.data || (Array.isArray(yearData) ? yearData : []);
          
          console.log('Year Data Full:', yearData);
          console.log('Year Raw Data:', rawData);
          
          processedData = rawData
            .filter(item => {
              const year = item.year || item._id;
              return year !== null && year !== undefined && !isNaN(Number(year));
            })
            .map((item) => {
              const year = item.year || item._id;
              return {
                name: `Năm ${year}`,
                yearNumber: toNumber(year),
                revenue: toNumber(item.total_revenue || item.revenue),
                orders: toNumber(item.total_orders || item.orders),
              };
            })
            .sort((a, b) => a.yearNumber - b.yearNumber);
          break;

        default:
          processedData = [];
      }
      
      console.log('Chart Type:', chartType);
      console.log('Processed Data:', processedData);
      
      return processedData;
    } catch (error) {
      console.error("Error processing chart data:", error);
      return [];
    }
  };

  // Format date cho chart
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Lấy doanh thu với fallback
  const getRevenue = (data, fallbackValue = 0) => {
    if (!data) return fallbackValue;
    return toNumber(data.total_revenue || data.revenue || fallbackValue);
  };

  // Tính tổng số đơn hàng theo trạng thái
  const getOrdersByStatus = (statusList) => {
    return orders.filter((order) => 
      statusList.includes(order.status?.toLowerCase())
    ).length;
  };

  const getPendingOrders = () => getOrdersByStatus(["pending"]);
  const getConfirmedOrders = () => getOrdersByStatus(["confirmed"]);
  const getShippingOrders = () => getOrdersByStatus(["shipping"]);
  const getCompletedOrders = () => getOrdersByStatus(["completed"]);

  // Format currency
  const formatCurrency = (value) => {
    const amount = toNumber(value);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format number
  const formatNumber = (value) => {
    return new Intl.NumberFormat("vi-VN").format(toNumber(value));
  };

  const chartData = getChartData();
  const hasChartData = chartData.length > 0;
  
  // Debug analytics data
  useEffect(() => {
    console.log('=== Analytics State ===');
    console.log('Analytics:', analytics);
    console.log('Chart Type:', chartType);
    console.log('Chart Data:', chartData);
    console.log('Has Chart Data:', hasChartData);
  }, [analytics, chartType, chartData, hasChartData]);

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="admin-light" style={{ padding: "20px", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        Admin Dashboard
      </h1>

      {/* Cards thống kê doanh thu */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <StatCard
          title="Doanh thu tuần này"
          value={formatCurrency(getRevenue(analytics.revenueByWeek))}
          subtitle={`Tuần ${currentWeek} - ${currentYear}`}
          color="#10B981"
          icon="📊"
        />

        <StatCard
          title="Doanh thu tháng này"
          value={formatCurrency(getRevenue(analytics.revenueByMonth))}
          subtitle={`Tháng ${currentMonth}/${currentYear}`}
          color="#F97316"
          icon="💰"
        />

        <StatCard
          title="Doanh thu năm nay"
          value={formatCurrency(getRevenue(analytics.revenueByYear))}
          subtitle={`Năm ${currentYear}`}
          color="#3B82F6"
          icon="🎯"
        />
      </div>

      {/* Cards thống kê đơn hàng */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <StatCard
          title="Tổng đơn hàng"
          value={formatNumber(orders.length)}
          subtitle="Tất cả đơn hàng"
          color="#8B5CF6"
          icon="📦"
        />

        <StatCard
          title="Đơn đang xử lý"
          value={formatNumber(getPendingOrders())}
          subtitle="Chờ xác nhận"
          color="#EF4444"
          icon="⏳"
        />

        <StatCard
          title="Đơn đang giao"
          value={formatNumber(getShippingOrders())}
          subtitle="Đang vận chuyển"
          color="#F59E0B"
          icon="🚚"
        />

        <StatCard
          title="Đơn hoàn thành"
          value={formatNumber(getCompletedOrders())}
          subtitle="Đã giao thành công"
          color="#10B981"
          icon="✅"
        />
      </div>

      {/* Biểu đồ doanh thu */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          marginBottom: "30px",
        }}
      >
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
            📈 Biểu đồ doanh thu
          </h2>

          {/* Chart controls */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #D1D5DB",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <option value="day">📅 Theo ngày</option>
              <option value="month">📊 Theo tháng</option>
              <option value="year">📈 Theo năm</option>
            </select>

            {chartType === "month" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid #D1D5DB",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    Năm {year}
                  </option>
                ))}
              </select>
            )}

            {chartType === "day" && (
              <>
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start_date: e.target.value })
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #D1D5DB",
                    fontSize: "14px",
                  }}
                />
                <span style={{ color: "#6B7280" }}>đến</span>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end_date: e.target.value })
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #D1D5DB",
                    fontSize: "14px",
                  }}
                />
              </>
            )}

            <button
              onClick={loadChartData}
              disabled={loading}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: loading ? "#D1D5DB" : "#F97316",
                color: "white",
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              {loading ? "⏳ Đang tải..." : "🔄 Làm mới"}
            </button>
          </div>
        </div>

        {/* Chart or Empty State */}
        {loading ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            color: "#6B7280" 
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>⏳</div>
            <div>Đang tải dữ liệu...</div>
          </div>
        ) : !hasChartData ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px", 
            color: "#6B7280",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📊</div>
            <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "5px" }}>
              Không có dữ liệu
            </div>
            <div style={{ fontSize: "14px" }}>
              {chartType === "day" && "Chọn khoảng thời gian khác để xem dữ liệu"}
              {chartType === "month" && "Chưa có dữ liệu cho năm này"}
              {chartType === "year" && "Chưa có dữ liệu doanh thu"}
            </div>
          </div>
        ) : (
          <>
            {/* Summary Info */}
            <div style={{ 
              display: "flex", 
              gap: "20px", 
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#F9FAFB",
              borderRadius: "8px",
              flexWrap: "wrap"
            }}>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                  Tổng doanh thu
                </div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#F97316" }}>
                  {formatCurrency(chartData.reduce((sum, item) => sum + item.revenue, 0))}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>Tổng đơn hàng</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#3B82F6" }}>
                  {formatNumber(chartData.reduce((sum, item) => sum + item.orders, 0))} đơn
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>
                  {chartType === "day" ? "Ngày cao nhất" : 
                   chartType === "month" ? "Tháng cao nhất" : 
                   "Năm cao nhất"}
                </div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#10B981" }}>
                  {(() => {
                    const maxItem = chartData.reduce((max, item) => 
                      item.revenue > max.revenue ? item : max
                    , chartData[0] || { revenue: 0, name: "N/A" });
                    return maxItem.name;
                  })()}
                </div>
                <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
                  {formatCurrency(Math.max(...chartData.map(d => d.revenue)))}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>Trung bình/đơn</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#8B5CF6" }}>
                  {formatCurrency(
                    chartData.reduce((sum, item) => sum + item.revenue, 0) /
                    Math.max(chartData.reduce((sum, item) => sum + item.orders, 0), 1)
                  )}
                </div>
              </div>
            </div>

            {/* Chart - TẤT CẢ ĐỀU DÙNG BAR CHART */}
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                  angle={chartType === "day" ? -45 : 0}
                  textAnchor={chartType === "day" ? "end" : "middle"}
                  height={chartType === "day" ? 80 : 60}
                />
                <YAxis 
                  stroke="#F97316"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value;
                  }}
                  label={{ 
                    value: 'Doanh thu (VNĐ)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fontSize: 12, fill: '#6B7280' }
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    padding: "12px"
                  }}
                  formatter={(value, name) => {
                    return [formatCurrency(value), "Doanh thu"];
                  }}
                  labelFormatter={(label) => label}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#F97316" 
                  name="Doanh thu"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={chartType === "month" ? 60 : chartType === "year" ? 50 : 40}
                />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Bảng đơn hàng mới nhất */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
          📋 Đơn hàng mới nhất
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6B7280" }}>
            <div style={{ fontSize: "30px", marginBottom: "10px" }}>⏳</div>
            Đang tải...
          </div>
        ) : orders.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "40px", 
            color: "#6B7280",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px"
          }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📦</div>
            <div style={{ fontSize: "16px", fontWeight: "500" }}>
              Chưa có đơn hàng nào
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#F3F4F6" }}>
                  <th style={{ 
                    padding: "12px", 
                    borderBottom: "2px solid #E5E7EB", 
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151"
                  }}>
                    Mã đơn
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    borderBottom: "2px solid #E5E7EB", 
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151"
                  }}>
                    Khách hàng
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    borderBottom: "2px solid #E5E7EB", 
                    textAlign: "right",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151"
                  }}>
                    Số tiền
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    borderBottom: "2px solid #E5E7EB", 
                    textAlign: "center",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151"
                  }}>
                    Trạng thái
                  </th>
                  <th style={{ 
                    padding: "12px", 
                    borderBottom: "2px solid #E5E7EB", 
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#374151"
                  }}>
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr 
                    key={order.order_id}
                    style={{ 
                      transition: "background-color 0.2s",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F9FAFB"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ 
                      padding: "12px", 
                      borderBottom: "1px solid #E5E7EB",
                      fontSize: "14px",
                      fontFamily: "monospace",
                      color: "#6B7280"
                    }}>
                      #{order.order_id?.toString().slice(-8) || "N/A"}
                    </td>
                    <td style={{ 
                      padding: "12px", 
                      borderBottom: "1px solid #E5E7EB",
                      fontSize: "14px"
                    }}>
                      {order.customer?.name ||
                        order.customer?.email ||
                        order.shipping?.name ||
                        "Khách hàng"}
                    </td>
                    <td style={{ 
                      padding: "12px", 
                      borderBottom: "1px solid #E5E7EB",
                      textAlign: "right",
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#F97316"
                    }}>
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td style={{ 
                      padding: "12px", 
                      borderBottom: "1px solid #E5E7EB", 
                      textAlign: "center" 
                    }}>
                      <StatusBadge status={order.status} />
                    </td>
                    <td style={{ 
                      padding: "12px", 
                      borderBottom: "1px solid #E5E7EB",
                      fontSize: "14px",
                      color: "#6B7280"
                    }}>
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ====================================================
// SUB COMPONENTS
// ====================================================

function StatCard({ title, value, subtitle, color, icon }) {
  return (
    <div
      style={{
        flex: "1",
        minWidth: "220px",
        backgroundColor: "#FFFFFF",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        borderLeft: `4px solid ${color}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        fontSize: "30px",
        opacity: 0.2
      }}>
        {icon}
      </div>
      <h3 style={{ 
        fontSize: "14px", 
        color: "#6B7280", 
        marginBottom: "8px",
        fontWeight: "500"
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: "28px", 
        fontWeight: "bold", 
        color: color, 
        marginBottom: "4px",
        wordBreak: "break-word"
      }}>
        {value}
      </p>
      <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
        {subtitle}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { label: "Đang xử lý", color: "#EF4444", bg: "#FEE2E2", icon: "⏳" },
    confirmed: { label: "Đã xác nhận", color: "#3B82F6", bg: "#DBEAFE", icon: "✓" },
    shipping: { label: "Đang giao", color: "#F59E0B", bg: "#FEF3C7", icon: "🚚" },
    completed: { label: "Hoàn thành", color: "#10B981", bg: "#D1FAE5", icon: "✓" },
    cancelled: { label: "Đã hủy", color: "#6B7280", bg: "#F3F4F6", icon: "✕" },
  };

  const normalizedStatus = status?.toLowerCase() || "pending";
  const config = statusConfig[normalizedStatus] || statusConfig.pending;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "600",
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

// ====================================================
// HELPER FUNCTIONS
// ====================================================

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getLastWeekDate() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
}