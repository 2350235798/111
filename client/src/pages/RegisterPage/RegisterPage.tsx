import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone, User, Lock, GraduationCap } from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { useAuth } from '@client/src/contexts/AuthContext';

interface FormErrors {
  phone?: string;
  nickname?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!/^1\d{10}$/.test(phone)) {
      newErrors.phone = '请输入正确的11位手机号';
    }
    if (nickname.length < 2 || nickname.length > 20) {
      newErrors.nickname = '昵称长度为2-20个字符';
    }
    if (password.length < 6 || password.length > 20) {
      newErrors.password = '密码长度为6-20位';
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ phone, password, nickname });
      toast.success('注册成功，欢迎加入机电校园！');
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败，请重试';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 app-gradient-bg">
      <div className="w-full max-w-[400px] animate-fade-up">
        {/* Logo & 标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-[hsl(210_100%_55%)] to-[hsl(260_90%_65%)] shadow-lg shadow-primary/20">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[hsl(210_100%_50%)] to-[hsl(260_90%_60%)] bg-clip-text text-transparent">
            机电校园
          </h1>
          <p className="text-sm text-muted-foreground mt-2">创建新账号，开启校园之旅</p>
        </div>

        {/* 注册卡片 */}
        <div className="relative">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 blur-sm" />
          <div className="relative bg-card rounded-2xl p-8 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* 昵称 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">昵称</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="请输入昵称"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      if (errors.nickname) setErrors((prev) => ({ ...prev, nickname: undefined }));
                    }}
                    className={`pl-10 h-11 ${errors.nickname ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    maxLength={20}
                    aria-invalid={!!errors.nickname}
                  />
                </div>
                {errors.nickname && (
                  <p className="text-xs text-destructive">{errors.nickname}</p>
                )}
              </div>

              {/* 密码 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="请设置6-20位密码"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`pl-10 h-11 ${errors.password ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    aria-invalid={!!errors.password}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              {/* 确认密码 */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="请再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className={`pl-10 h-11 ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                    aria-invalid={!!errors.confirmPassword}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 注册按钮 */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-medium rounded-xl bg-gradient-to-r from-[hsl(210_100%_52%)] to-[hsl(260_90%_62%)] hover:from-[hsl(210_100%_48%)] hover:to-[hsl(260_90%_58%)] shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all border-0 mt-6"
              >
                {loading ? '注册中...' : '注 册'}
              </Button>
            </form>

            {/* 切换链接 */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">已有账号？</span>
              <Link
                to="/login"
                className="text-primary font-medium hover:underline ml-1"
              >
                立即登录
              </Link>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          注册即表示同意《用户协议》和《隐私政策》
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
