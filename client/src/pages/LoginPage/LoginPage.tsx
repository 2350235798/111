import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { useAuth } from '@client/src/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { phone?: string; password?: string } = {};

    if (!/^1\d{10}$/.test(phone)) {
      newErrors.phone = '请输入正确的11位手机号';
    }
    if (password.length < 6 || password.length > 20) {
      newErrors.password = '密码长度为6-20位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ phone, password });
      toast.success('登录成功，欢迎回来！');
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请重试';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 app-gradient-bg">
      <div className="w-full max-w-[400px] animate-fade-up">
        {/* Logo & 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-[hsl(210_100%_55%)] to-[hsl(260_90%_65%)] shadow-lg shadow-primary/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(210_100%_50%)] to-[hsl(260_90%_60%)] bg-clip-text text-transparent">
            机电校园
          </h1>
          <p className="text-sm text-muted-foreground mt-2">欢迎回来，登录你的账号</p>
        </div>

        {/* 登录卡片 */}
        <div className="relative">
          {/* 渐变边框效果 */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 blur-sm" />
          <div className="relative bg-card rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 手机号 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">手机号</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    className={`pl-10 h-11 ${errors.phone ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    maxLength={11}
                    aria-invalid={!!errors.phone}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* 密码 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">密码</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`pr-10 pl-3 h-11 ${errors.password ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-medium rounded-xl bg-gradient-to-r from-[hsl(210_100%_52%)] to-[hsl(260_90%_62%)] hover:from-[hsl(210_100%_48%)] hover:to-[hsl(260_90%_58%)] shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all border-0"
              >
                {loading ? '登录中...' : '登 录'}
              </Button>
            </form>

            {/* 切换链接 */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">还没有账号？</span>
              <Link
                to="/register"
                className="text-primary font-medium hover:underline ml-1"
              >
                立即注册
              </Link>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
