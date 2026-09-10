import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Inbox, Sparkles } from 'lucide-react';
import { logger } from '@client/src/utils/logger';
import { Button } from '@client/src/components/ui/button';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { postsApi } from '@client/src/api/app';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import type { PostItem } from '@shared/api.interface';

const PAGE_SIZE = 10;

function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 card-shadow space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-40 w-full rounded-lg" />
      <div className="flex justify-around pt-2 border-t border-border/50">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async (pageNum: number, append = false) => {
    const isFirst = pageNum === 1 && !append;
    if (isFirst) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const result = await postsApi.getList(pageNum, PAGE_SIZE);
      setTotal(result.total);
      if (append) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPosts = result.items.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      } else {
        setPosts(result.items);
      }
      setPage(pageNum);
    } catch (err) {
      logger.error('加载帖子列表失败', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const handlePostCreated = (post: PostItem) => {
    setPosts((prev) => [post, ...prev]);
    setTotal((t) => t + 1);
  };

  const handleLikeUpdate = (postId: string, liked: boolean, likeCount: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isLiked: liked, likeCount } : p)),
    );
  };

  const handleCommentCountUpdate = (postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: p.commentCount + delta } : p,
      ),
    );
  };

  const handleLoadMore = () => {
    if (loadingMore || loading) return;
    loadPosts(page + 1, true);
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadPosts(1);
  };

  const hasMore = posts.length < total;

  return (
    <div className="min-h-screen pb-6">
      <div className="max-w-[600px] mx-auto px-4 py-4 md:py-6 space-y-4">
        {/* 顶部标题栏 */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              首页
            </h1>
            <Sparkles size={18} className="text-accent/70" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="text-muted-foreground hover:text-primary"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            刷新
          </Button>
        </header>

        {/* 发帖组件 */}
        <PostComposer onPostCreated={handlePostCreated} />

        {/* 信息流 */}
        <div className="space-y-4">
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-12 text-center card-shadow">
              <Inbox size={48} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">暂无帖子</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                快来发布第一条动态吧～
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLikeUpdate={handleLikeUpdate}
                  onCommentCountUpdate={handleCommentCountUpdate}
                />
              ))}

              {/* 加载更多 */}
              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full max-w-[200px]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        加载中...
                      </>
                    ) : (
                      '加载更多'
                    )}
                  </Button>
                </div>
              ) : posts.length > 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground/60">
                  — 没有更多了 —
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
