import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

export default function Register() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = "用户名不能为空";
    } else if (formData.username.length < 3) {
      newErrors.username = "用户名至少3个字符";
    }

    if (!formData.password) {
      newErrors.password = "密码不能为空";
    } else if (formData.password.length < 6) {
      newErrors.password = "密码至少6个字符";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "必须同意服务条款";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateForm()) {
      setStep(2);
    }
  };

  const handleRegister = () => {
    if (validateForm()) {
      toast.success("注册成功！请登录您的账户");
      setTimeout(() => setLocation("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -ml-48 -mb-48"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setLocation("/login")}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              返回
            </button>
            <div className="text-white font-semibold">
              第 {step} / 2 步
            </div>
          </div>

          <Card className="shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">
                {step === 1 ? "创建账户" : "完成注册"}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-8">
              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <p className="text-gray-600">
                    请填写以下信息创建您的梦之源账户
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户名 *
                    </label>
                    <input
                      type="text"
                      placeholder="输入用户名"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.username ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.username && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={16} />
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      密码 *
                    </label>
                    <PasswordStrengthIndicator
                      password={formData.password}
                      onChange={(value) =>
                        setFormData({ ...formData, password: value })
                      }
                      placeholder="输入密码"
                      showRequirements={true}
                    />
                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={16} />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      确认密码 *
                    </label>
                    <input
                      type="password"
                      placeholder="再次输入密码"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={16} />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    下一步
                  </Button>
                </div>
              )}

              {/* Step 2: Confirmation */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      账户信息确认
                    </h3>
                    <p className="text-gray-600 mb-6">
                      请确认以下信息无误后提交注册
                    </p>

                    <div className="space-y-3 text-left bg-white rounded-lg p-4 mb-6">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">用户名：</span>
                        <span className="font-semibold text-gray-900">
                          {formData.username}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">初始入金：</span>
                        <span className="font-semibold text-green-600">
                          300 USD
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">📋 注册须知：</span>
                      <br />
                      • 账户创建后需要进行初始入金 300 USD
                      <br />
                      • 入金确认后即可开始获得分润收益
                      <br />
                      • 可邀请他人加入获得代理分润
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.agreeTerms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreeTerms: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      我同意
                      <a href="#" className="text-blue-600 hover:underline">
                        服务条款
                      </a>
                      和
                      <a href="#" className="text-blue-600 hover:underline">
                        隐私政策
                      </a>
                    </label>
                  </div>
                  {errors.agreeTerms && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.agreeTerms}
                    </p>
                  )}

                  <div className="flex gap-4">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1 py-3 rounded-lg font-semibold"
                    >
                      上一步
                    </Button>
                    <Button
                      onClick={handleRegister}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-lg font-semibold transition-all"
                    >
                      完成注册
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-center text-white text-sm mt-6">
            已有账户？
            <button
              onClick={() => setLocation("/login")}
              className="font-semibold hover:underline ml-1"
            >
              直接登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
