import React, { useState } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@client/src/utils/logger';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { likesApi, postsApi } from '@client/src/api/app';
import CommentSection from './CommentSection';
import type { PostItem } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

interface PostCardProps {
  post: PostItem;
  onLikeUpdate?: (postId: string, liked: boolean, likeCount: number) => void;
  onCommentCountUpdate?: (postId: string, delta: number) => void;
}

export default function PostCard({ post, onLikeUpdate, onCommentCountUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);
  const [animatingHeart, setAnimatingHeart] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const prevLiked = isLiked;
    const prevCount = likeCount;
    // 乐观更新
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    if (!prevLiked) {
      setAnimatingHeart(true);
      setTimeout(() => setAnimatingHeart(false), 400);
    }
    try {
      const result = await likesApi.toggle(post.id);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
      onLikeUpdate?.(post.id, result.liked, result.likeCount);
    } catch (err) {
      logger.error('点赞失败', err);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error('操作失败，请重试');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}#/post/${post.id}`;
      await navigator.clipboard.writeText(shareUrl);
      setShareCount((c) => c + 1);
      try {
        await postsApi.share(post.id);
      } catch {
        // 静默处理后端计数
      }
      toast.success('分享链接已复制');
    } catch (err) {
      logger.error('分享失败', err);
      toast.error('复制链接失败');
    }
  };

  const toggleComments = () => {
    setShowComments((v) => !v);
  };

  const handleCommentCountChange = (delta: number) => {
    setCommentCount((c) => c + delta);
    onCommentCountUpdate?.(post.id, delta);
  };

  const imageGridClass =
    post.imageUrls.length === 1
      ? 'grid-cols-1'
      : post.imageUrls.length <= 4
        ? 'grid-cols-2'
        : 'grid-cols-3';

  return (
    <article className="bg-white rounded-2xl border border-border p-4 card-shadow card-shadow-hover transition-all duration-300 hover:-translate-y-0.5 animate-fade-up">
      {/* 作者信息 */}
      <div className="flex items-center gap-3">
        <Avatar className="w-10 h-10 shrink-0 ring-2 ring-white shadow-sm">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.nickname}
              className="w-full h-full object-cover"
            />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
              {post.author.nickname.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {post.author.nickname}
          </p>
          <p className="text-xs text-muted-foreground">{formatTime(post.createdAt)}</p>
        </div>
      </div>

      {/* 正文 */}
      {post.content && (
        <p className="mt-3 text-sm leading-relaxed text-foreground/90 break-words whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* 图片区 */}
      {post.imageUrls.length > 0 && (
        <div className={`grid gap-1.5 mt-3 ${imageGridClass}`}>
          {post.imageUrls.map((url, index) => (
            <div
              key={index}
              className={`relative overflow-hidden rounded-lg bg-muted ${
                post.imageUrls.length === 1 ? 'aspect-video' : 'aspect-square'
              }`}
            >
              <Image
                src={url}
                alt={`配图 ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* 操作栏 */}
      <div className="flex items-center justify-around mt-3 pt-2 border-t border-border/50">
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg transition-all duration-200 hover:bg-muted/70 active:scale-95 ${
            isLiked ? 'text-rose-500' : 'text-muted-foreground'
          }`}
          aria-label={isLiked ? '取消点赞' : '点赞'}
        >
          <Heart
            size={18}
            fill={isLiked ? 'currentColor' : 'none'}
            strokeWidth={2}
            className={animatingHeart ? 'animate-heart' : ''}
          />
          <span className="text-xs font-medium tabular-nums">{likeCount}</span>
        </button>

        <button
          type="button"
          onClick={toggleComments}
          className={`flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg transition-all duration-200 hover:bg-muted/70 active:scale-95 ${
            showComments ? 'text-primary' : 'text-muted-foreground'
          }`}
          aria-label="评论"
        >
          <MessageCircle size={18} strokeWidth={2} />
          <span className="text-xs font-medium tabular-nums">{commentCount}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-primary active:scale-95"
          aria-label="分享"
        >
          <Share2 size={18} strokeWidth={2} />
          <span className="text-xs font-medium tabular-nums">{shareCount}</span>
        </button>
      </div>

      {/* 评论区 */}
      {showComments && (
        <CommentSection postId={post.id} onCommentCountChange={handleCommentCountChange} />
      )}
    </article>
  );
}
