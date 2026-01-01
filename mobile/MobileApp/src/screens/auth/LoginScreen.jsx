import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../providers/AuthProvider";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

// ================= Validation Schemas =================
const schema = yup.object({
  email: yup.string().required("Email bắt buộc").email("Email không hợp lệ"),
  password: yup.string().required("Mật khẩu bắt buộc").min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

const extraSchema = yup.object({
  phone_number: yup.string().required("Số điện thoại không được bỏ trống"),
  date_of_birth: yup
    .string()
    .required("Ngày sinh không được bỏ trống")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Định dạng phải là YYYY-MM-DD"),
});

export default function Login({ navigation }) {
  const { login, loginWithOAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });
  const { control: controlExtra, handleSubmit: handleSubmitExtra, formState: { errors: extraErrors }, reset: resetExtraForm } = useForm({
    resolver: yupResolver(extraSchema),
  });

  // ================= CONFIG GOOGLE SIGNIN =================
  useEffect(() => {
    GoogleSignin.configure({
      // Thay bằng Web Client ID từ Google Cloud Console của bạn
      webClientId: "1077684370519-rhcb81r4g6ucog168m3eo2vu5u1cqke7.apps.googleusercontent.com", 
      offlineAccess: true,
    });
  }, []);

  // Hàm xử lý điều hướng chung dựa trên role
  const handleNavigation = (res) => {
    const role = res?.user?.role || res?.role || "user";
    if (role === "admin") {
      navigation.replace("AdminDashboard");
    } else {
      navigation.replace("MainApp");
    }
  };

  // ================= EMAIL/PASSWORD LOGIN =================
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await login({ email: data.email, password: data.password });
      handleNavigation(res);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Email hoặc mật khẩu không đúng";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // ================= GOOGLE LOGIN =================
 const handleGoogleLogin = async () => {
    try {
      setOauthLoading(true);
      console.log("Step 1: Checking Play Services...");
      await GoogleSignin.hasPlayServices();

      console.log("Step 2: Starting Google Sign In...");
      const userInfo = await GoogleSignin.signIn();
      console.log('userInfo', userInfo);
console.log('idToken', userInfo.idToken);
console.log('accessToken', userInfo.accessToken);
      
      console.log("Step 3: UserInfo received:", JSON.stringify(userInfo));

      const token = userInfo.idToken || userInfo.data?.idToken;
      if (!token) {
        console.error("Step 4 Error: No idToken found!");
        return;
      }

      console.log("Step 5: Calling API loginWithOAuth with token...");
      setGoogleToken(token);
      
      // ĐÂY LÀ KHÚC GỌI API
      const res = await loginWithOAuth({ token });
      
      console.log("Step 6: API Response:", JSON.stringify(res));

      if (res?.needsExtraInfo) {
        setShowExtraForm(true);
      } else {
        handleNavigation(res);
      }
    } catch (err) {
      console.error("FULL ERROR OBJECT:", err);
      // Nếu lỗi code 10 là do SHA-1 hoặc ClientID sai loại Web
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled");
      } else {
        Alert.alert("Lỗi", err.message || "Đăng nhập Google thất bại");
      }
    } finally {
      setOauthLoading(false);
    }
  };
  // ================= EXTRA INFO SUBMIT =================
  const onSubmitExtra = async (data) => {
    try {
      setOauthLoading(true);
      const res = await loginWithOAuth({ 
        token: googleToken, 
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth 
      });
      
      setShowExtraForm(false);
      handleNavigation(res);
    } catch (err) {
      setErrorMessage("Không thể cập nhật thông tin bổ sung");
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.subtitle}>Vui lòng đăng nhập để tiếp tục</Text>
      </View>

      {/* FORM LOGIN TRUYỀN THỐNG */}
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="example@gmail.com"
              style={[styles.input, errors.email && styles.inputError]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggleText}>{showPassword ? "Ẩn" : "Hiện"}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              style={[styles.input, errors.password && styles.inputError]}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>
        )}
      />

      {errorMessage ? <Text style={styles.mainErrorText}>{errorMessage}</Text> : null}

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
        style={styles.loginButton}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Đăng nhập</Text>}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>Hoặc</Text>
        <View style={styles.line} />
      </View>

      {/* GOOGLE LOGIN BUTTON */}
      <TouchableOpacity
        onPress={handleGoogleLogin}
        disabled={oauthLoading}
        style={styles.googleButton}
      >
        {oauthLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.googleButtonText}>Đăng nhập với Google</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.linkText}>Quên mật khẩu?</Text>
        </TouchableOpacity>
        <View style={styles.registerRow}>
          <Text>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL CẬP NHẬT THÔNG TIN */}
      <Modal visible={showExtraForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thông tin bổ sung</Text>
            <Text style={styles.modalSubtitle}>Vì đây là lần đầu bạn đăng nhập bằng Google, vui lòng hoàn thiện thông tin.</Text>

            <Controller
              control={controlExtra}
              name="phone_number"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Số điện thoại</Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="09xx xxx xxx"
                    style={styles.input}
                    keyboardType="phone-pad"
                  />
                  {extraErrors.phone_number && <Text style={styles.errorText}>{extraErrors.phone_number.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={controlExtra}
              name="date_of_birth"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="1995-01-01"
                    style={styles.input}
                  />
                  {extraErrors.date_of_birth && <Text style={styles.errorText}>{extraErrors.date_of_birth.message}</Text>}
                </View>
              )}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                onPress={() => setShowExtraForm(false)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmitExtra(onSubmitExtra)}
                disabled={oauthLoading}
                style={[styles.modalButton, styles.submitButton]}
              >
                {oauthLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff" }}>Hoàn tất</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: "#fff", justifyContent: "center" },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#1f2937" },
  subtitle: { fontSize: 16, color: "#6b7280", marginTop: 4 },
  inputContainer: { marginBottom: 16 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  toggleText: { color: "#f97316", fontSize: 12, fontWeight: "600" },
  input: { 
    borderWidth: 1, 
    borderColor: "#d1d5db", 
    padding: 12, 
    borderRadius: 10, 
    fontSize: 16, 
    backgroundColor: "#f9fafb" 
  },
  inputError: { borderColor: "#ef4444" },
  errorText: { color: "#ef4444", fontSize: 12, marginTop: 4 },
  mainErrorText: { color: "#ef4444", textAlign: "center", marginBottom: 16, fontWeight: "500" },
  loginButton: { backgroundColor: "#f97316", padding: 16, borderRadius: 12, alignItems: "center", elevation: 2 },
  loginButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { marginHorizontal: 10, color: "#9ca3af" },
  googleButton: { 
    borderWidth: 1, 
    borderColor: "#d1d5db", 
    padding: 16, 
    borderRadius: 12, 
    alignItems: "center", 
    flexDirection: "row", 
    justifyContent: "center" 
  },
  googleButtonText: { color: "#374151", fontWeight: "600", fontSize: 16 },
  footer: { marginTop: 24, alignItems: "center" },
  linkText: { color: "#f97316", fontWeight: "700" },
  registerRow: { flexDirection: "row", marginTop: 12 },
  modalOverlay: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  modalSubtitle: { color: "#6b7280", marginBottom: 20 },
  modalActionRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalButton: { flex: 1, padding: 14, borderRadius: 10, alignItems: "center" },
  cancelButton: { backgroundColor: "#f3f4f6" },
  submitButton: { backgroundColor: "#f97316" },
});