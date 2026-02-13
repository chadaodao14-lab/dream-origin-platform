import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ArrowRight, Users, TrendingUp, Gift, Heart } from "lucide-react";

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -ml-48 -mb-48"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side - Brand & Features */}
            <div className="text-white space-y-8 hidden lg:block">
              <div>
                <h1 className="text-5xl font-bold mb-4">梦之源</h1>
                <p className="text-xl text-blue-100 mb-2">创业投资平台</p>
                <p className="text-blue-100 text-lg">
                  通过九级代理分润系统实现财富增长，参与创业项目投资，共同创造美好未来
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-white bg-opacity-20">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">九级代理分润</h3>
                    <p className="text-blue-100 text-sm">
                      20%/8%/7%/6%/5%/4%/3%/2%/1% 的分润比例，自动计算和分配
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-white bg-opacity-20">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">创业项目投资</h3>
                    <p className="text-blue-100 text-sm">
                      参与精选创业项目，分享项目成长收益
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-white bg-opacity-20">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">资产管理</h3>
                    <p className="text-blue-100 text-sm">
                      完整的资产追踪、提现、转账功能
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-white bg-opacity-20">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">慈善公益</h3>
                    <p className="text-blue-100 text-sm">
                      参与慈善基金，共同承担社会责任
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
              {/* Mobile Brand */}
              <div className="lg:hidden text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">梦之源</h1>
                <p className="text-gray-600">创业投资平台</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-8 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`pb-4 px-4 font-semibold transition-colors ${
                    activeTab === "login"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`pb-4 px-4 font-semibold transition-colors ${
                    activeTab === "register"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  注册
                </button>
                <button
                  onClick={() => setActiveTab("invite")}
                  className={`pb-4 px-4 font-semibold transition-colors ${
                    activeTab === "invite"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  邀请码注册
                </button>
              </div>

              {/* Login Tab */}
              {activeTab === "login" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <p className="text-center text-gray-700 mb-6 text-lg">
                      欢迎回到梦之源平台
                    </p>
                    <p className="text-center text-gray-600 text-sm mb-6">
                      使用 Manus 账户快速登录，开始您的投资之旅
                    </p>
                  </div>

                  <Button
                    onClick={() => (window.location.href = getLoginUrl())}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  >
                    <span>使用 Manus 账户登录</span>
                    <ArrowRight size={20} />
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">首次登录？</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("register")}
                    className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                  >
                    创建新账户
                  </button>
                </div>
              )}

              {/* Register Tab */}
              {activeTab === "register" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <p className="text-center text-gray-700 mb-2 text-lg font-semibold">
                      创建新账户
                    </p>
                    <p className="text-center text-gray-600 text-sm">
                      注册成为梦之源平台会员，开启财富增长之路
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">📝 注册说明：</span>
                      <br />
                      • 初始入金金额为 300 USD
                      <br />
                      • 直推人数上限为 5 人
                      <br />
                      • 可邀请他人加入获得分润
                    </p>
                  </div>

                  <Button
                    onClick={() => (window.location.href = getLoginUrl())}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  >
                    <span>使用 Manus 账户注册</span>
                    <ArrowRight size={20} />
                  </Button>

                  <p className="text-center text-gray-600 text-sm">
                    已有账户？
                    <button
                      onClick={() => setActiveTab("login")}
                      className="text-blue-600 font-semibold hover:underline ml-1"
                    >
                      直接登录
                    </button>
                  </p>
                </div>
              )}

              {/* Invite Code Register Tab */}
              {activeTab === "invite" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <p className="text-center text-gray-700 mb-2 text-lg font-semibold">
                      邀请码注册
                    </p>
                    <p className="text-center text-gray-600 text-sm">
                      使用邀请码注册，成为代理团队的一员
                    </p>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-purple-800">
                      <span className="font-semibold">🎁 邀请码优势：</span>
                      <br />
                      • 自动加入上级代理团队
                      <br />
                      • 享受团队分润收益
                      <br />
                      • 获得专属支持和指导
                      <br />
                      • 快速扩大您的团队规模
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        邀请码
                      </label>
                      <input
                        type="text"
                        placeholder="输入您的邀请码"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => (window.location.href = getLoginUrl())}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg font-semibold rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  >
                    <span>使用邀请码注册</span>
                    <ArrowRight size={20} />
                  </Button>

                  <p className="text-center text-gray-600 text-sm">
                    没有邀请码？
                    <button
                      onClick={() => setActiveTab("register")}
                      className="text-blue-600 font-semibold hover:underline ml-1"
                    >
                      直接注册
                    </button>
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500">
                  登录即表示您同意我们的
                  <a href="#" className="text-blue-600 hover:underline ml-1">
                    服务条款
                  </a>
                  和
                  <a href="#" className="text-blue-600 hover:underline ml-1">
                    隐私政策
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
