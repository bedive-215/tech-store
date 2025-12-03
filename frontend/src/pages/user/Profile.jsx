import React, { useEffect, useRef, useState } from "react";
import { useUser } from "@/Providers/UserProvider";
import { Loader2, Camera } from "lucide-react";

/* Avatar component tối ưu */
const AvatarImage = React.memo(function AvatarImage({
  src,
  alt = "Avatar",
  className = "",
  fallback = "/default-avatar.png",
  onBroken = null,
}) {
  const imgRef = useRef(null);
  const lastSrcRef = useRef(null);

  useEffect(() => {
    const final = src && typeof src === "string" && src.trim() !== "" ? src.trim() : fallback;
    if (lastSrcRef.current === final) return;

    lastSrcRef.current = final;
    const img = imgRef.current;
    if (!img) return;

    const handleError = () => {
      if (onBroken) onBroken(img.src);
      img.onerror = null;
      img.src = fallback;
    };

    img.onerror = handleError;
    img.src = final;

    return () => {
      img.onerror = null;
    };
  }, [src, fallback, onBroken]);

  return <img ref={imgRef} alt={alt} className={className} />;
});

export default function Profile() {
  const {
    user,
    loading: contextLoading,
    error,
    fetchMyInfo,
    updateMyInfo,
  } = useUser();

  const [previewAvatar, setPreviewAvatar] = useState("/default-avatar.png");
  const failedAvatarUrls = useRef(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    avatar: null,
  });

  useEffect(() => {
    const load = async () => {
      await fetchMyInfo();
      setIsInitialLoad(false);
    };
    load();
  }, [fetchMyInfo]);

  useEffect(() => {
    if (user) {
      setPreviewAvatar(user.avatar || "/default-avatar.png");
      setForm({
        full_name: user.full_name || user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || user.phone || "",
        date_of_birth: user.date_of_birth || "",
        avatar: null,
      });
    }
  }, [user]);

  const handleAvatarBroken = (failedUrl) => {
    failedAvatarUrls.current.add(failedUrl);
    setPreviewAvatar("/default-avatar.png");
  };

  const onChangeInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChooseAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, avatar: file }));
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    try {
      await updateMyInfo(form);

      // 🔥 Sau khi lưu → fetch lại thông tin mới → thoát edit → reload trang
      await fetchMyInfo();
      setIsEditing(false);
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setForm({
        full_name: user.full_name || user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || user.phone || "",
        date_of_birth: user.date_of_birth || "",
        avatar: null,
      });
      setPreviewAvatar(user.avatar || "/default-avatar.png");
    }
  };

  if (isInitialLoad && contextLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 mt-10 flex justify-center items-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error && !user) {
    return <p className="text-red-500 text-center mt-10">{error}</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Thông tin cá nhân</h1>
          <p className="text-gray-600 mt-2">
            {isEditing ? "Chỉnh sửa thông tin của bạn" : "Chế độ chỉ xem"}
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg shadow hover:bg-orange-600 transition"
          >
            Chỉnh sửa
          </button>
        )}
      </div>

      <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200">
        <div className="flex justify-center mb-8 relative">
          <AvatarImage
            src={previewAvatar}
            alt="Avatar"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-md"
            fallback="/default-avatar.png"
            onBroken={handleAvatarBroken}
          />

          {isEditing && (
            <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow cursor-pointer border">
              <Camera size={18} />
              <input type="file" accept="image/*" className="hidden" onChange={handleChooseAvatar} />
            </label>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-medium text-gray-700 mb-2">Họ và tên</label>
            {isEditing ? (
              <input
                name="full_name"
                value={form.full_name}
                onChange={onChangeInput}
                className="p-3 border rounded-lg w-full"
              />
            ) : (
              <p className="p-3 bg-gray-50 border rounded-lg">{form.full_name || "-"}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-2">Email</label>
            {isEditing ? (
              <input
                name="email"
                value={form.email}
                onChange={onChangeInput}
                className="p-3 border rounded-lg w-full"
              />
            ) : (
              <p className="p-3 bg-gray-50 border rounded-lg">{form.email || "-"}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-2">Số điện thoại</label>
            {isEditing ? (
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={onChangeInput}
                className="p-3 border rounded-lg w-full"
              />
            ) : (
              <p className="p-3 bg-gray-50 border rounded-lg">{form.phone_number || "-"}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-2">Ngày sinh</label>
            {isEditing ? (
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={onChangeInput}
                className="p-3 border rounded-lg w-full"
              />
            ) : (
              <p className="p-3 bg-gray-50 border rounded-lg">{form.date_of_birth || "-"}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              Hủy
            </button>

            <button
              onClick={handleSubmit}
              disabled={contextLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
            >
              {contextLoading && <Loader2 size={16} className="animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
