// src/pages/NotFound.jsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { SearchX, RotateCw } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const { getHealth } = useAnalytics();

  // ✅ Giả lập kiểm tra trạng thái hệ thống (fallback)
  const simulateHealth = () => {
    setLoading(true);
    setErr("");
    setTimeout(() => {
      const ok = Math.random() > 0.25;
      setHealth({
        ok,
        message: ok
          ? "Hệ thống hoạt động bình thường."
          : "Một số dịch vụ đang gặp sự cố, vui lòng thử lại sau.",
      });
      setLoading(false);
    }, 600);
  };

  // 🔍 Kiểm tra qua AnalyticsProvider
  const checkHealth = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await getHealth();
      const data = res?.data ?? [];
      let ok = true;
      if (Array.isArray(data)) ok = data.every((x) => x?.status !== "error");
      else if (data && typeof data === "object") ok = data.ok ?? true;
      setHealth({
        ok,
        message: ok
          ? "Hệ thống hoạt động bình thường."
          : "Một số dịch vụ đang gặp sự cố, vui lòng thử lại sau.",
      });
    } catch (e) {
      setErr("Không thể kiểm tra trạng thái, dùng mô phỏng");
      simulateHealth();
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const StatusCard = () => (
    <div className="mt-5 text-sm text-gray-600 bg-white border rounded-lg px-4 py-3 shadow-sm max-w-md w-full">
      <div className="flex items-center justify-center">
        <span
          className={`inline-block w-2 h-2 rounded-full mr-2 ${
            health?.ok ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {loading
          ? "Đang kiểm tra hệ thống..."
          : health?.ok
          ? "Hệ thống hoạt động bình thường"
          : "Hệ thống đang gặp sự cố"}
      </div>

      {err && <div className="mt-2 text-red-600">{err}</div>}

      {health?.message && (
        <div className="mt-2 text-gray-500 text-sm">{health.message}</div>
      )}

      <button
        onClick={checkHealth}
        className="mt-3 text-xs flex items-center justify-center gap-1 px-3 py-1 border rounded hover:bg-gray-50 transition disabled:opacity-50"
        disabled={loading}
      >
        <RotateCw
          className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
        />
        {loading ? "Đang tải..." : "Thử kiểm tra lại"}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-gradient-to-b from-gray-50 to-gray-100 px-6">
      <SearchX className="text-red-600 w-16 h-16 mb-4" />
      <h1 className="text-6xl font-extrabold text-red-600">404</h1>
      <p className="text-lg mt-3 text-gray-700 font-medium">
        Trang bạn truy cập không tồn tại hoặc đã bị di chuyển.
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Đường dẫn:{" "}
        <code className="px-1 py-0.5 bg-gray-100 rounded text-gray-700">
          {location.pathname}
        </code>
      </p>

      <StatusCard />

      <div className="mt-8 flex gap-3 flex-wrap justify-center">
        <a
          href="/"
          className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Về trang chủ
        </a>
        <a
          href="/login"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Đăng nhập
        </a>
      </div>
    </div>
  );
};

export default NotFound;
