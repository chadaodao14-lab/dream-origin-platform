import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Gift, Users, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";

export default function InviteRegister() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [inviteCode, setInviteCode] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inviteInfo, setInviteInfo] = useState<any>(null);

  const validateInviteCode = () => {
    if (!inviteCode.trim()) {
      setErrors({ inviteCode: "邀请码不能为空" });
      return;
    }

    // Simulate API call to validate invite code
    if (inviteCode.length === 8) {
      setInviteInfo({
        code: inviteCode,
        referrer: "代理商 #" + Math.floor(Math.random() * 1000),
        level: Math.floor(Math.random() * 9) + 1,
        teamSize: Math.floor(Math.random() * 100) + 10,
        commissionRate: "20%",
      });
      setErrors({});
      setStep(2);
    } else {
      setErrors({ inviteCode: "邀请码格式不正确（8位字符）" });
    }
  };

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

  const handleRegister = () => {
    if (validateForm()) {
      toast.success("注册成功！已加入代理团队");
      setTimeout(() => setLocation("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600">
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
            {step > 1 && (
              <div className="text-white font-semibold">
                第 {step - 1} / 2 步
              </div>
            )}
          </div>

          <Card className="shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Gift size={28} />
                {step === 1 ? "输入邀请码" : "完成注册"}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-8">
              {/* Step 1: Invite Code */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      🎁 邀请码注册的优势
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            加入代理团队
                          </p>
                          <p className="text-sm text-gray-600">
                            自动成为上级代理的团队成员
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            享受分润收益
                          </p>
                          <p className="text-sm text-gray-600">
                            获得上级的分润支持和团队收益
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Gift className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            专属支持
                          </p>
                          <p className="text-sm text-gray-600">
                            获得专业的指导和运营支持
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      邀请码 *
                    </label>
                    <input
                      type="text"
                      placeholder="输入8位邀请码"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      maxLength={8}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg tracking-widest font-mono ${
                        errors.inviteCode ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.inviteCode && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={16} />
                        {errors.inviteCode}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      邀请码由您的上级代理提供
                    </p>
                  </div>

                  <Button
                    onClick={validateInviteCode}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    验证邀请码
                  </Button>

                  <div className="text-center">
                    <p className="text-gray-600 text-sm">
                      没有邀请码？
                      <button
                        onClick={() => setLocation("/register")}
                        className="text-purple-600 font-semibold hover:underline ml-1"
                      >
                        直接注册
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Registration Form */}
              {step === 2 && inviteInfo && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Invite Info Display */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900">
                          邀请码验证成功！
                        </p>
                        <p className="text-sm text-green-700">
                          您将加入以下代理团队
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-green-800">推荐人：</span>
                        <span className="font-semibold text-green-900">
                          {inviteInfo.referrer}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-green-200">
                        <span className="text-green-800">团队规模：</span>
                        <span className="font-semibold text-green-900">
                          {inviteInfo.teamSize} 人
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-green-800">一级分润：</span>
                        <span className="font-semibold text-green-900">
                          {inviteInfo.commissionRate}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Registration Form */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">
                      填写账户信息
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        用户名 *
                      </label>
                      <input
                        type="text"
                        placeholder="输入用户名"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                          setFormData({
                            ...formData,
                            password: value,
                          })
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
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
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
                      <a href="#" className="text-purple-600 hover:underline">
                        服务条款
                      </a>
                      和
                      <a href="#" className="text-purple-600 hover:underline">
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
                      onClick={() => {
                        setStep(1);
                        setInviteInfo(null);
                      }}
                      variant="outline"
                      className="flex-1 py-3 rounded-lg font-semibold"
                    >
                      返回
                    </Button>
                    <Button
                      onClick={handleRegister}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-semibold transition-all"
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
