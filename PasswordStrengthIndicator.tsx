import { useState, useMemo } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

export default function PasswordStrengthIndicator({
  password,
  onChange,
  placeholder = "输入密码",
  className = "",
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Calculate password strength
  const strengthInfo = useMemo(() => {
    let strength = 0;
    const requirements: PasswordRequirement[] = [
      { label: "至少8个字符", regex: /.{8,}/, met: false },
      { label: "包含大写字母", regex: /[A-Z]/, met: false },
      { label: "包含小写字母", regex: /[a-z]/, met: false },
      { label: "包含数字", regex: /\d/, met: false },
      { label: "包含特殊字符", regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, met: false },
    ];

    // Check each requirement
    requirements.forEach((req) => {
      if (req.regex.test(password)) {
        req.met = true;
        strength += 20;
      }
    });

    // Determine strength level
    let level: "weak" | "fair" | "good" | "strong" | "very-strong" = "weak";
    let label = "弱";
    let color = "bg-red-500";
    let textColor = "text-red-600";

    if (strength >= 80) {
      level = "very-strong";
      label = "非常强";
      color = "bg-green-500";
      textColor = "text-green-600";
    } else if (strength >= 60) {
      level = "strong";
      label = "强";
      color = "bg-emerald-500";
      textColor = "text-emerald-600";
    } else if (strength >= 40) {
      level = "good";
      label = "中等";
      color = "bg-yellow-500";
      textColor = "text-yellow-600";
    } else if (strength >= 20) {
      level = "fair";
      label = "一般";
      color = "bg-orange-500";
      textColor = "text-orange-600";
    }

    return {
      strength,
      level,
      label,
      color,
      textColor,
      requirements,
    };
  }, [password]);

  return (
    <div className="space-y-3">
      {/* Password Input */}
      <div className={`relative ${className}`}>
        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          value={password}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showPassword ? (
            <EyeOff size={20} />
          ) : (
            <Eye size={20} />
          )}
        </button>
      </div>

      {/* Strength Indicator */}
      {password && (
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${strengthInfo.color} transition-all duration-300`}
                style={{ width: `${strengthInfo.strength}%` }}
              ></div>
            </div>
            <span className={`text-sm font-semibold ${strengthInfo.textColor} whitespace-nowrap`}>
              {strengthInfo.label}
            </span>
          </div>

          {/* Requirements Checklist */}
          {showRequirements && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-700">密码要求：</p>
              <div className="space-y-1.5">
                {strengthInfo.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div
                      className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                        req.met
                          ? "bg-green-100"
                          : "bg-gray-200"
                      }`}
                    >
                      {req.met ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <X size={14} className="text-gray-400" />
                      )}
                    </div>
                    <span
                      className={
                        req.met
                          ? "text-green-700 font-medium"
                          : "text-gray-600"
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Strength Tips */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                {strengthInfo.strength < 40 && (
                  <p className="text-xs text-orange-700 bg-orange-50 px-2 py-1.5 rounded">
                    💡 提示：添加大写字母、数字和特殊字符可以提高密码强度
                  </p>
                )}
                {strengthInfo.strength >= 40 && strengthInfo.strength < 80 && (
                  <p className="text-xs text-blue-700 bg-blue-50 px-2 py-1.5 rounded">
                    ✓ 不错！继续添加更多字符类型以获得更强的密码
                  </p>
                )}
                {strengthInfo.strength >= 80 && (
                  <p className="text-xs text-green-700 bg-green-50 px-2 py-1.5 rounded">
                    ✓ 优秀！您的密码非常安全
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!password && (
        <div className="text-xs text-gray-500 text-center py-2">
          输入密码以查看强度指示
        </div>
      )}
    </div>
  );
}
