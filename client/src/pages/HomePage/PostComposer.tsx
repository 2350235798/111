import React, { useState } from 'react';
import { Image, Send } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@client/src/utils/logger';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import { Avatar, AvatarFallback } from '@client/src/components/ui/avatar';
import { postsApi } from '@client/src/api/app';
import { useAuth } from '@client/src/contexts/AuthContext';
import type { PostItem } from '@shared/api.interface';
import { Link } from 'react-router-dom';
import { Image as UIImage } from '@client/src/components/ui/image';

const MAX_CONTENT_LENGTH = 500;

interface PostComposerProps {
  onPostCreated: (post: PostItem) => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const contentLength = content.length;
  const isOverLimit = contentLength > MAX_CONTENT_LENGTH;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !submitting;

  const handleAddImage = () => {
    const url = window.prompt('请输入图片 URL：');
    if (!url) return;
    const trimmed = url.trim();
    if (!trimmed) return;
    if (imageUrls.length >= 9) {
      toast.warning('最多只能上传 9 张图片');
      return;
    }
    setImageUrls((prev) => [...prev, trimmed]);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    try {
      const result = await postsApi.create({ content: content.trim(), imageUrls });
      toast.success('发布成功');
      setContent('');
      setImageUrls([]);
      onPostCreated(result.post);
    } catch (err) {
      logger.error('发帖失败', err);
      toast.error(err instanceof Error ? err.message : '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-2xl border border-border p-6 text-center card-shadow">
        <p className="text-muted-foreground">
          登录后才能发帖，快去{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            登录
          </Link>{' '}
          吧～
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-4 card-shadow card-shadow-hover transition-shadow">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          {user.avatarUrl ? (
            <UIImage src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
              {user.nickname.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <Textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="分享此刻的想法..."
            className="resize-none border-0 focus-visible:ring-0 px-0 py-1 text-base min-h-[80px] placeholder:text-muted-foreground/70"
            rows={3}
          />

          {imageUrls.length > 0 && (
            <div
              className={`grid gap-2 mt-3 ${
                imageUrls.length === 1
                  ? 'grid-cols-1'
                  : imageUrls.length <= 4
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
              }`}
            >
              {imageUrls.map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                >
                  <UIImage
                    src={url}
                    alt={`图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    aria-label="删除图片"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddImage}
                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                <Image size={18} />
                <span className="text-xs">图片</span>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs tabular-nums ${
                  isOverLimit ? 'text-destructive font-semibold' : 'text-muted-foreground'
                }`}
              >
                {contentLength}/{MAX_CONTENT_LENGTH}
              </span>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="bg-gradient-to-r from-primary to-accent text-white border-0 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all min-w-[80px]"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    发布中
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    发布
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
