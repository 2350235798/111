import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@client/src/utils/logger';
import { toast } from 'sonner';
import {
  Camera,
  Edit3,
  FileText,
  Heart,
  Users,
  ChevronRight,
  Shield,
  LogOut,
  MessageCircle,
  User,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';

import { Button } from '@client/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@client/src/components/ui/dialog';
import { Input } from '@client/src/components/ui/input';
import { Textarea } from '@client/src/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Separator } from '@client/src/components/ui/separator';
import { Skeleton } from '@client/src/components/ui/skeleton';

import { useAuth } from '@client/src/contexts/AuthContext';
import { usersApi, postsApi } from '@client/src/api/app';
import type { PostItem, UserProfile } from '@shared/api.interface';

function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

function getCooldownDays(lastUpdate: string | null): number {
  if (!lastUpdate) return 0;
  const diff = Date.now() - new Date(lastUpdate).getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return Math.max(0, 30 - days);
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [myPosts, setMyPosts] = useState<PostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Dialog states
  const [nicknameDialogOpen, setNicknameDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [bioDialogOpen, setBioDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const [nicknameInput, setNicknameInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [bioInput, setBioInput] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await usersApi.getProfile();
      setProfile(res.user);
    } catch (err) {
      logger.error('获取个人资料失败', err);
      toast.error('获取个人资料失败');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const fetchMyPosts = useCallback(async () => {
    if (!user) return;
    try {
      setPostsLoading(true);
      const res = await postsApi.getList(1, 100);
      const filtered = res.items.filter((p: PostItem) => p.authorId === user.id);
      setMyPosts(filtered);
    } catch (err) {
      logger.error('获取我的动态失败', err);
    } finally {
      setPostsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
    fetchMyPosts();
  }, [fetchProfile, fetchMyPosts]);

  const displayProfile = profile ?? user;

  const cooldownDays = displayProfile
    ? getCooldownDays(displayProfile.nicknameUpdatedAt)
    : 0;
  const canEditNickname = cooldownDays === 0;

  const handleUpdateNickname = async () => {
    if (!nicknameInput.trim()) {
      toast.error('昵称不能为空');
      return;
    }
    if (nicknameInput.trim().length > 20) {
      toast.error('昵称不能超过20个字符');
      return;
    }
    try {
      setSaving(true);
      await usersApi.updateProfile({ nickname: nicknameInput.trim() });
      toast.success('昵称修改成功');
      setNicknameDialogOpen(false);
      await Promise.all([refreshUser(), fetchProfile()]);
    } catch (err) {
      logger.error('修改昵称失败', err);
      toast.error('修改昵称失败');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!avatarInput.trim()) {
      toast.error('请输入头像URL');
      return;
    }
    try {
      setSaving(true);
      await usersApi.updateProfile({ avatarUrl: avatarInput.trim() });
      toast.success('头像修改成功');
      setAvatarDialogOpen(false);
      await Promise.all([refreshUser(), fetchProfile()]);
    } catch (err) {
      logger.error('修改头像失败', err);
      toast.error('修改头像失败');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBio = async () => {
    if (bioInput.length > 200) {
      toast.error('简介不能超过200字');
      return;
    }
    try {
      setSaving(true);
      await usersApi.updateProfile({ bio: bioInput });
      toast.success('简介修改成功');
      setBioDialogOpen(false);
      await Promise.all([refreshUser(), fetchProfile()]);
    } catch (err) {
      logger.error('修改简介失败', err);
      toast.error('修改简介失败');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('已退出登录');
    setLogoutDialogOpen(false);
  };

  const openNicknameDialog = () => {
    setNicknameInput(displayProfile?.nickname ?? '');
    setNicknameDialogOpen(true);
  };

  const openAvatarDialog = () => {
    setAvatarInput(displayProfile?.avatarUrl ?? '');
    setAvatarDialogOpen(true);
  };

  const openBioDialog = () => {
    setBioInput(displayProfile?.bio ?? '');
    setBioDialogOpen(true);
  };

  const totalLikes = myPosts.reduce((sum: number, p: PostItem) => sum + p.likeCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      {/* Cover */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        {/* decorative dots */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-8 left-10 h-3 w-3 rounded-full bg-white/60" />
          <div className="absolute top-16 right-20 h-2 w-2 rounded-full bg-white/50" />
          <div className="absolute top-6 right-32 h-4 w-4 rounded-full bg-white/40" />
          <div className="absolute bottom-12 left-1/4 h-2.5 w-2.5 rounded-full bg-white/50" />
          <div className="absolute bottom-6 right-1/3 h-3 w-3 rounded-full bg-white/30" />
          <div className="absolute top-24 left-1/2 h-2 w-2 rounded-full bg-white/40" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      <div className="relative mx-auto -mt-20 max-w-2xl px-4">
        {/* Avatar + Info Card */}
        <Card className="relative overflow-hidden border-0 shadow-lg shadow-slate-200/60">
          <CardContent className="pt-0">
            <div className="flex flex-col items-center pt-14 pb-6">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-white shadow-md">
                  {displayProfile?.avatarUrl ? (
                    <AvatarImage src={displayProfile.avatarUrl} alt="avatar" />
                  ) : (
                    <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                      {displayProfile?.nickname?.charAt(0) ?? 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <button
                  type="button"
                  onClick={openAvatarDialog}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white transition-all hover:scale-105 hover:shadow-lg"
                  aria-label="编辑头像"
                >
                  <Camera className="h-4 w-4 text-slate-600" />
                </button>
              </div>

              {profileLoading ? (
                <div className="mt-4 w-full space-y-2 text-center">
                  <Skeleton className="mx-auto h-6 w-32" />
                  <Skeleton className="mx-auto h-4 w-48" />
                  <Skeleton className="mx-auto h-4 w-24" />
                </div>
              ) : (
                <>
                  <h1 className="mt-4 text-xl font-bold text-slate-900">
                    {displayProfile?.nickname ?? '用户'}
                  </h1>
                  <p className="mt-1.5 max-w-xs text-center text-sm text-slate-500 leading-relaxed">
                    {displayProfile?.bio || '这个人很懒，什么都没留下~'}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    <span>
                      {displayProfile?.phone ? maskPhone(displayProfile.phone) : ''}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="mt-4 border-0 shadow-md shadow-slate-200/60">
          <CardContent className="p-0">
            <div className="grid grid-cols-3 py-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-indigo-500">
                  <FileText className="h-4 w-4" />
                  <span className="text-xl font-bold text-slate-900">
                    {myPosts.length}
                  </span>
                </div>
                <span className="text-xs text-slate-500">发帖数</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-slate-100">
                <div className="flex items-center gap-1.5 text-rose-500">
                  <Heart className="h-4 w-4" />
                  <span className="text-xl font-bold text-slate-900">
                    {totalLikes}
                  </span>
                </div>
                <span className="text-xs text-slate-500">获赞数</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <Users className="h-4 w-4" />
                  <span className="text-xl font-bold text-slate-900">0</span>
                </div>
                <span className="text-xs text-slate-500">关注数</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Posts */}
        <Card className="mt-4 border-0 shadow-md shadow-slate-200/60">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">我的动态</h2>
              <span className="text-xs text-slate-400">共 {myPosts.length} 条</span>
            </div>
            {postsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : myPosts.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <FileText className="mb-2 h-10 w-10 opacity-40" />
                <p className="text-sm">还没有发布任何动态</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPosts.map((post: PostItem) => (
                  <div
                    key={post.id}
                    className="rounded-xl bg-slate-50/80 p-3 transition-colors hover:bg-slate-100/80"
                  >
                    <p className="line-clamp-2 text-sm text-slate-700">
                      {post.content}
                    </p>
                    {post.imageUrls && post.imageUrls.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                        <ImageIcon className="h-3 w-3" />
                        <span>{post.imageUrls.length} 张图片</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(post.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          <span>{post.likeCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings List */}
        <Card className="mt-4 overflow-hidden border-0 shadow-md shadow-slate-200/60">
          <CardContent className="p-0">
            <h2 className="px-5 pt-4 pb-2 text-sm font-semibold text-slate-900">
              编辑资料
            </h2>

            <button
              type="button"
              onClick={openNicknameDialog}
              className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                  <Edit3 className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">昵称</p>
                  <p className="text-xs text-slate-400">
                    {displayProfile?.nickname ?? '加载中...'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>

            <Separator className="ml-16" />

            <button
              type="button"
              onClick={openAvatarDialog}
              className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                  <Camera className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">头像</p>
                  <p className="text-xs text-slate-400">点击修改头像URL</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>

            <Separator className="ml-16" />

            <button
              type="button"
              onClick={openBioDialog}
              className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">简介</p>
                  <p className="max-w-[200px] truncate text-xs text-slate-400">
                    {displayProfile?.bio || '暂无简介'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </button>

            <div className="h-2 bg-slate-50/80" />

            <h2 className="px-5 pt-4 pb-2 text-sm font-semibold text-slate-900">
              账号与安全
            </h2>

            <div className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                  <Shield className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">手机号</p>
                  <p className="text-xs text-slate-400">
                    {displayProfile?.phone
                      ? maskPhone(displayProfile.phone)
                      : '未绑定'}
                  </p>
                </div>
              </div>
            </div>

            <div className="h-2 bg-slate-50/80" />

            <div className="px-5 py-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setLogoutDialogOpen(true)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nickname Dialog */}
      <Dialog open={nicknameDialogOpen} onOpenChange={setNicknameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改昵称</DialogTitle>
            <DialogDescription>
              昵称每30天只能修改一次
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                新昵称
              </label>
              <Input
                value={nicknameInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNicknameInput(e.target.value)
                }
                placeholder="请输入新昵称"
                maxLength={20}
                disabled={!canEditNickname || saving}
              />
            </div>
            {!canEditNickname && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                昵称修改冷却中，还需 {cooldownDays} 天才能修改
              </div>
            )}
            <p className="text-xs text-slate-400">
              字数限制：{nicknameInput.length}/20
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNicknameDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateNickname}
              disabled={!canEditNickname || saving || !nicknameInput.trim()}
            >
              {saving ? '保存中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Dialog */}
      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改头像</DialogTitle>
            <DialogDescription>
              输入图片URL作为新头像
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex justify-center">
              <Avatar className="h-20 w-20 border-2 border-slate-200">
                {avatarInput ? (
                  <AvatarImage src={avatarInput} alt="preview" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                    {displayProfile?.nickname?.charAt(0) ?? 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                头像URL
              </label>
              <Input
                value={avatarInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAvatarInput(e.target.value)
                }
                placeholder="https://example.com/avatar.jpg"
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAvatarDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateAvatar}
              disabled={saving || !avatarInput.trim()}
            >
              {saving ? '保存中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bio Dialog */}
      <Dialog open={bioDialogOpen} onOpenChange={setBioDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改简介</DialogTitle>
            <DialogDescription>
              简单介绍一下自己吧
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Textarea
              value={bioInput}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setBioInput(e.target.value)
              }
              placeholder="介绍一下自己..."
              maxLength={200}
              rows={5}
              disabled={saving}
            />
            <p className="text-right text-xs text-slate-400">
              {bioInput.length}/200
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBioDialogOpen(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={handleUpdateBio} disabled={saving}>
              {saving ? '保存中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirm Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>退出登录</DialogTitle>
            <DialogDescription>
              确定要退出当前账号吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              className="flex-1 sm:flex-none"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1 sm:flex-none"
            >
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
