import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '@client/src/utils/logger';
import { toast } from 'sonner';
import {
  Users,
  FileText,
  MessageSquare,
  Heart,
  Calendar,
  UserPlus,
  Ban,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  BarChart3,
  UserCog,
  LayoutList,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { adminApi } from '@client/src/api/app';
import { useAuth } from '@client/src/contexts/AuthContext';
import type { AdminStats, UserProfile, PostItem } from '@shared/api.interface';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Badge } from '@client/src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from '@client/src/components/ui/empty';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  trend: 'up' | 'down';
  trendValue: string;
}

function StatCard({ title, value, icon, gradient, trend, trendValue }: StatCardProps) {
  return (
    <Card className={`overflow-hidden bg-gradient-to-br ${gradient} text-white border-0 shadow-lg`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/80 mb-1">{title}</p>
            <p className="text-3xl font-bold">{value.toLocaleString()}</p>
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-white/90' : 'text-white/70'}`}>
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {trendValue}
            </div>
          </div>
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PAGE_SIZE = 10;

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('stats');

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersTotal, setUsersTotal] = useState<number>(0);
  const [usersPage, setUsersPage] = useState<number>(1);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  // Posts state
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsTotal, setPostsTotal] = useState<number>(0);
  const [postsPage, setPostsPage] = useState<number>(1);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);

  // Ban dialog
  const [banDialogOpen, setBanDialogOpen] = useState<boolean>(false);
  const [banTargetUser, setBanTargetUser] = useState<UserProfile | null>(null);
  const [banAction, setBanAction] = useState<'ban' | 'unban'>('ban');
  const [banLoading, setBanLoading] = useState<boolean>(false);

  // Delete post dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteTargetPost, setDeleteTargetPost] = useState<PostItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Visibility action loading
  const [visibilityLoadingId, setVisibilityLoadingId] = useState<string | null>(null);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data: AdminStats = await adminApi.getStats();
      setStats(data);
      logger.info('获取管理后台统计数据成功');
    } catch (err) {
      logger.error('获取统计数据失败', err);
      toast.error('获取统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async (page: number, kw?: string) => {
    setUsersLoading(true);
    try {
      const data = await adminApi.getUsers(page, PAGE_SIZE, kw || undefined);
      setUsers(data.items);
      setUsersTotal(data.total);
      logger.info(`获取用户列表成功, page=${page}, total=${data.total}`);
    } catch (err) {
      logger.error('获取用户列表失败', err);
      toast.error('获取用户列表失败');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(async (page: number) => {
    setPostsLoading(true);
    try {
      const data = await adminApi.getPosts(page, PAGE_SIZE);
      setPosts(data.items);
      setPostsTotal(data.total);
      logger.info(`获取帖子列表成功, page=${page}, total=${data.total}`);
    } catch (err) {
      logger.error('获取帖子列表失败', err);
      toast.error('获取帖子列表失败');
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'stats' && !stats) {
      fetchStats();
    }
  }, [activeTab, stats, fetchStats]);

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0 && !usersLoading) {
      fetchUsers(1, keyword);
    }
  }, [activeTab, users.length, usersLoading, keyword, fetchUsers]);

  useEffect(() => {
    if (activeTab === 'posts' && posts.length === 0 && !postsLoading) {
      fetchPosts(1);
    }
  }, [activeTab, posts.length, postsLoading, fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setUsersPage(1);
    fetchUsers(1, searchInput.trim());
  };

  const handleBanClick = (targetUser: UserProfile) => {
    if (targetUser.isBanned) {
      setBanAction('unban');
    } else {
      setBanAction('ban');
    }
    setBanTargetUser(targetUser);
    setBanDialogOpen(true);
  };

  const handleConfirmBan = async () => {
    if (!banTargetUser) return;
    setBanLoading(true);
    try {
      const banned = banAction === 'ban';
      await adminApi.banUser(banTargetUser.id, banned);
      toast.success(banned ? '封禁成功' : '解封成功');
      setBanDialogOpen(false);
      setBanTargetUser(null);
      fetchUsers(usersPage, keyword);
      fetchStats();
    } catch (err) {
      logger.error('操作失败', err);
      const message = err instanceof Error ? err.message : '操作失败';
      toast.error(message);
    } finally {
      setBanLoading(false);
    }
  };

  const handleDeleteClick = (post: PostItem) => {
    setDeleteTargetPost(post);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetPost) return;
    setDeleteLoading(true);
    try {
      await adminApi.deletePost(deleteTargetPost.id);
      toast.success('删除成功');
      setDeleteDialogOpen(false);
      setDeleteTargetPost(null);
      fetchPosts(postsPage);
      fetchStats();
    } catch (err) {
      logger.error('删除帖子失败', err);
      const message = err instanceof Error ? err.message : '删除失败';
      toast.error(message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleVisibilityToggle = async (post: PostItem) => {
    setVisibilityLoadingId(post.id);
    try {
      const newVisible = !post.isVisible;
      await adminApi.setVisibility(post.id, newVisible);
      toast.success(newVisible ? '已恢复可见' : '已隐藏');
      fetchPosts(postsPage);
    } catch (err) {
      logger.error('设置可见性失败', err);
      const message = err instanceof Error ? err.message : '操作失败';
      toast.error(message);
    } finally {
      setVisibilityLoadingId(null);
    }
  };

  const handleUsersPrev = () => {
    const prev = Math.max(1, usersPage - 1);
    setUsersPage(prev);
    fetchUsers(prev, keyword);
  };

  const handleUsersNext = () => {
    const maxPage = Math.ceil(usersTotal / PAGE_SIZE);
    const next = Math.min(maxPage, usersPage + 1);
    setUsersPage(next);
    fetchUsers(next, keyword);
  };

  const handlePostsPrev = () => {
    const prev = Math.max(1, postsPage - 1);
    setPostsPage(prev);
    fetchPosts(prev);
  };

  const handlePostsNext = () => {
    const maxPage = Math.ceil(postsTotal / PAGE_SIZE);
    const next = Math.min(maxPage, postsPage + 1);
    setPostsPage(next);
    fetchPosts(next);
  };

  const totalUserPages = Math.ceil(usersTotal / PAGE_SIZE);
  const totalPostPages = Math.ceil(postsTotal / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-8">
      {/* 顶部 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 text-white">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">管理员后台</h1>
              <p className="text-xs text-muted-foreground">
                {user?.nickname || '管理员'} · 管理社区内容与用户
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <Tabs defaultValue="stats" value={activeTab} onValueChange={setActiveTab}
          className="w-full mt-4">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4" />
              数据概览
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4" />
              用户管理
            </TabsTrigger>
            <TabsTrigger value="posts">
              <LayoutList className="h-4 w-4" />
              内容管理
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats">
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i: number) => (
                  <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="用户总数"
                  value={stats.totalUsers}
                  icon={<Users className="h-6 w-6" />}
                  gradient="from-blue-500 to-cyan-400"
                  trend="up"
                  trendValue="较上周 +12%"
                />
                <StatCard
                  title="帖子总数"
                  value={stats.totalPosts}
                  icon={<FileText className="h-6 w-6" />}
                  gradient="from-purple-500 to-indigo-500"
                  trend="up"
                  trendValue="较上周 +8%"
                />
                <StatCard
                  title="评论总数"
                  value={stats.totalComments}
                  icon={<MessageSquare className="h-6 w-6" />}
                  gradient="from-emerald-500 to-teal-400"
                  trend="up"
                  trendValue="较上周 +15%"
                />
                <StatCard
                  title="点赞总数"
                  value={stats.totalLikes}
                  icon={<Heart className="h-6 w-6" />}
                  gradient="from-rose-500 to-pink-500"
                  trend="up"
                  trendValue="较上周 +20%"
                />
                <StatCard
                  title="今日发帖"
                  value={stats.todayPosts}
                  icon={<Calendar className="h-6 w-6" />}
                  gradient="from-amber-500 to-orange-400"
                  trend="up"
                  trendValue="较昨日 +5%"
                />
                <StatCard
                  title="今日新增用户"
                  value={stats.todayUsers}
                  icon={<UserPlus className="h-6 w-6" />}
                  gradient="from-violet-500 to-purple-500"
                  trend="down"
                  trendValue="较昨日 -3%"
                />
              </div>
            ) : (
              <Empty>
                <EmptyMedia variant="icon">
                  <BarChart3 />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>暂无数据</EmptyTitle>
                  <EmptyDescription>统计数据加载失败</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between">
              <form onSubmit={handleSearch} className="flex-1 max-w-md w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索昵称或手机号..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </form>
              <Badge variant="secondary">
                共 {usersTotal} 位用户
              </Badge>
            </div>

            {usersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i: number) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>暂无用户</EmptyTitle>
                  <EmptyDescription>没有找到符合条件的用户</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                {/* 桌面端表格 */}
                <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50 text-muted-foreground text-sm">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium">用户</th>
                        <th className="text-left px-4 py-3 font-medium">手机号</th>
                        <th className="text-left px-4 py-3 font-medium">注册时间</th>
                        <th className="text-left px-4 py-3 font-medium">状态</th>
                        <th className="text-right px-4 py-3 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {users.map((u: UserProfile) => (
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={u.avatarUrl || undefined} />
                                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                                  {u.nickname.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm flex items-center gap-1.5">
                                  {u.nickname}
                                  {u.isAdmin && (
                                    <Badge variant="default" className="text-[10px] h-4 px-1">
                                      管理员
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {u.bio || '暂无简介'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{u.phone}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {u.isBanned ? (
                              <Badge variant="destructive" className="text-xs">
                                <Ban className="h-3 w-3 mr-1" />
                                已封禁
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs bg-emerald-500 hover:bg-emerald-600">
                                正常
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant={u.isBanned ? 'outline' : 'destructive'}
                              onClick={() => handleBanClick(u)}
                            >
                              {u.isBanned ? '解封' : '封禁'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 移动端卡片 */}
                <div className="md:hidden space-y-2">
                  {users.map((u: UserProfile) => (
                    <Card key={u.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={u.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                              {u.nickname.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-sm">{u.nickname}</span>
                                {u.isAdmin && (
                                  <Badge variant="default" className="text-[10px] h-4 px-1">
                                    管理员
                                  </Badge>
                                )}
                              </div>
                              {u.isBanned ? (
                                <Badge variant="destructive" className="text-xs">已封禁</Badge>
                              ) : (
                                <Badge variant="default" className="text-xs bg-emerald-500">正常</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{u.phone}</p>
                            <p className="text-xs text-muted-foreground">
                              注册：{new Date(u.createdAt).toLocaleDateString()}
                            </p>
                            <Button
                              size="sm"
                              variant={u.isBanned ? 'outline' : 'destructive'}
                              className="mt-2 w-full h-7 text-xs"
                              onClick={() => handleBanClick(u)}
                            >
                              {u.isBanned ? '解封用户' : '封禁用户'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 分页 */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    第 {usersPage} / {totalUserPages || 1} 页
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={usersPage <= 1 || usersLoading}
                      onClick={handleUsersPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={usersPage >= totalUserPages || usersLoading}
                      onClick={handleUsersNext}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">共 {postsTotal} 条帖子</p>
              <Badge variant="secondary">
                {postsTotal} 条
              </Badge>
            </div>

            {postsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i: number) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Empty>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>暂无帖子</EmptyTitle>
                  <EmptyDescription>还没有用户发布帖子</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <>
                <div className="space-y-3">
                  {posts.map((post: PostItem) => (
                    <Card key={post.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={post.author.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                              {post.author.nickname.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {post.author.nickname}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(post.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {post.isVisible ? (
                                  <Badge variant="default" className="text-xs bg-emerald-500">可见</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">已隐藏</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {post.content}
                            </p>
                            {post.imageUrls && post.imageUrls.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  📷 {post.imageUrls.length} 张图片
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3.5 w-3.5" />
                                  {post.likeCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  {post.commentCount}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVisibilityToggle(post)}
                                  disabled={visibilityLoadingId === post.id}
                                >
                                  {visibilityLoadingId === post.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : post.isVisible ? (
                                    <>
                                      <EyeOff className="h-3.5 w-3.5" />
                                      隐藏
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3.5 w-3.5" />
                                      恢复
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteClick(post)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  删除
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 分页 */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-xs text-muted-foreground">
                    第 {postsPage} / {totalPostPages || 1} 页
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={postsPage <= 1 || postsLoading}
                      onClick={handlePostsPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={postsPage >= totalPostPages || postsLoading}
                      onClick={handlePostsNext}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 封禁确认对话框 */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {banAction === 'ban' ? '确认封禁用户' : '确认解封用户'}
            </DialogTitle>
            <DialogDescription>
              {banAction === 'ban'
                ? '封禁后该用户将无法登录和发布内容。确定要继续吗？'
                : '解封后该用户将恢复正常使用权限。确定要继续吗？'}
            </DialogDescription>
          </DialogHeader>
          {banTargetUser && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={banTargetUser.avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                  {banTargetUser.nickname.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{banTargetUser.nickname}</p>
                <p className="text-xs text-muted-foreground">{banTargetUser.phone}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBanDialogOpen(false)}
              disabled={banLoading}
            >
              取消
            </Button>
            <Button
              variant={banAction === 'ban' ? 'destructive' : 'default'}
              onClick={handleConfirmBan}
              disabled={banLoading}
            >
              {banLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {banAction === 'ban' ? '确认封禁' : '确认解封'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除帖子确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认删除帖子
            </DialogTitle>
            <DialogDescription>
              删除后无法恢复。确定要删除这条帖子吗？
            </DialogDescription>
          </DialogHeader>
          {deleteTargetPost && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={deleteTargetPost.author.avatarUrl || undefined} />
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                    {deleteTargetPost.author.nickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {deleteTargetPost.author.nickname}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {deleteTargetPost.content}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
