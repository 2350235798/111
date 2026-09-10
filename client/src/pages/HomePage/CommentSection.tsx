import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@client/src/utils/logger';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { commentsApi } from '@client/src/api/app';
import { useAuth } from '@client/src/contexts/AuthContext';
import type { CommentItem } from '@shared/api.interface';
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

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (delta: number) => void;
}

export default function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const result = await commentsApi.getList(postId);
      setComments(result.items);
    } catch (err) {
      logger.error('加载评论失败', err);
      toast.error('加载评论失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!content.trim() || submitting) return;
    if (!user) {
      toast.warning('请先登录后再评论');
      return;
    }
    setSubmitting(true);
    try {
      const result = await commentsApi.create(postId, { content: content.trim() });
      setComments((prev) => [...prev, result.comment]);
      setContent('');
      onCommentCountChange?.(1);
      toast.success('评论成功');
    } catch (err) {
      logger.error('评论失败', err);
      toast.error(err instanceof Error ? err.message : '评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/60 animate-fade-up">
      {comments.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          暂无评论，快来抢沙发～
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              <Avatar className="w-8 h-8 shrink-0">
                {comment.author.avatarUrl ? (
                  <Image
                    src={comment.author.avatarUrl}
                    alt={comment.author.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground text-xs font-semibold">
                    {comment.author.nickname.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {comment.author.nickname}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 mt-0.5 break-words whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
        <Input
          ref={inputRef}
          value={content}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContent(e.target.value)}
          placeholder={user ? '说点什么...' : '登录后参与评论'}
          className="flex-1 h-9 text-sm"
          disabled={!user || submitting}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || !user || submitting}
          className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-sm shrink-0 h-9"
        >
          <Send size={14} />
          发送
        </Button>
      </form>
    </div>
  );
}
