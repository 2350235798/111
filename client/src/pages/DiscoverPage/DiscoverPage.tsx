import React from 'react';
import { logger } from '@client/src/utils/logger';
import {
  Search,
  Flame,
  Users,
  Heart,
  MessageCircle,
  TrendingUp,
  Sparkles,
  Compass,
  BookOpen,
  Utensils,
  GraduationCap,
  Briefcase,
  ShoppingBag,
  UserPlus,
} from 'lucide-react';
import { Input } from '@client/src/components/ui/input';
import { Button } from '@client/src/components/ui/button';
import { Badge } from '@client/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@client/src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';

interface TopicItem {
  id: string;
  name: string;
  count: number;
  gradient: string;
  icon: React.ReactNode;
}

interface RecommendUser {
  id: string;
  nickname: string;
  avatarUrl: string;
  bio: string;
}

interface HotPost {
  id: string;
  author: string;
  avatarUrl: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
}

const mockTopics: TopicItem[] = [
  {
    id: '1',
    name: '#校园生活',
    count: 12580,
    gradient: 'from-blue-500 to-cyan-400',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    id: '2',
    name: '#美食探店',
    count: 8962,
    gradient: 'from-orange-500 to-pink-500',
    icon: <Utensils className="h-5 w-5" />,
  },
  {
    id: '3',
    name: '#学习打卡',
    count: 15234,
    gradient: 'from-emerald-500 to-teal-400',
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    id: '4',
    name: '#考研交流',
    count: 6789,
    gradient: 'from-purple-500 to-indigo-500',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: '5',
    name: '#社团招新',
    count: 3421,
    gradient: 'from-rose-500 to-red-400',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: '6',
    name: '#二手交易',
    count: 9876,
    gradient: 'from-amber-500 to-yellow-400',
    icon: <ShoppingBag className="h-5 w-5" />,
  },
];

const mockRecommendUsers: RecommendUser[] = [
  { id: '1', nickname: '学霸小明', avatarUrl: '', bio: '数学系大三，考研中' },
  { id: '2', nickname: '美食达人', avatarUrl: '', bio: '吃遍校园周边' },
  { id: '3', nickname: '摄影小白', avatarUrl: '', bio: '用镜头记录生活' },
  { id: '4', nickname: '健身少女', avatarUrl: '', bio: '每日打卡运动' },
  { id: '5', nickname: '考研上岸', avatarUrl: '', bio: '计算机考研经验分享' },
  { id: '6', nickname: '吉他小王子', avatarUrl: '', bio: '音乐是我的信仰' },
  { id: '7', nickname: '旅行日记', avatarUrl: '', bio: '记录每一段旅途' },
];

const mockHotPosts: HotPost[] = [
  {
    id: '1',
    author: '学霸小明',
    avatarUrl: '',
    content:
      '今天图书馆学习10小时打卡！高数终于搞懂了泰勒展开，成就感满满💪 大家一起加油呀～',
    likes: 128,
    comments: 32,
    time: '2小时前',
  },
  {
    id: '2',
    author: '美食达人',
    avatarUrl: '',
    content: '学校西门新开的那家火锅店真的绝了！人均50吃到撑，毛肚特别新鲜，推荐指数五颗星⭐⭐⭐⭐⭐',
    likes: 256,
    comments: 67,
    time: '4小时前',
  },
  {
    id: '3',
    author: '摄影小白',
    avatarUrl: '',
    content: '秋日校园随手拍，银杏大道真的太美了！🍂 今年的秋天好像比往年来得更早一些...',
    likes: 189,
    comments: 45,
    time: '6小时前',
  },
  {
    id: '4',
    author: '考研上岸',
    avatarUrl: '',
    content:
      '考研倒计时100天！今天复习了数据结构的树和图，感觉进度有点慢，焦虑...有没有一起打卡的小伙伴？',
    likes: 312,
    comments: 89,
    time: '8小时前',
  },
  {
    id: '5',
    author: '健身少女',
    avatarUrl: '',
    content: '坚持健身第365天！从120斤到100斤，分享一下我的减脂心得～ 最重要的其实是坚持！💪',
    likes: 567,
    comments: 123,
    time: '昨天',
  },
];

export default function DiscoverPage() {
  React.useEffect(() => {
    logger.info('DiscoverPage mounted');
  }, []);

  const handleTopicClick = (topic: TopicItem) => {
    logger.info(`点击话题: ${topic.name}`);
  };

  const handleFollow = (userId: string) => {
    logger.info(`关注用户: ${userId}`);
  };

  const formatCount = (n: number): string => {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-8">
      {/* 顶部搜索栏 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索话题、用户或内容..."
            className="pl-10 bg-muted/50 border-muted-foreground/10"
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6 mt-6">
        {/* 发现页标题 */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-500 text-white">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">发现</h1>
            <p className="text-xs text-muted-foreground">探索精彩内容</p>
          </div>
        </div>

        {/* 热门话题 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold">热门话题</h2>
              <Badge variant="secondary" className="text-xs">
                实时
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              查看全部
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mockTopics.map((topic: TopicItem) => (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className={`group relative overflow-hidden rounded-xl p-4 text-white text-left transition-transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-br ${topic.gradient} shadow-md hover:shadow-lg`}
              >
                <div className="absolute -right-2 -top-2 opacity-20">
                  <div className="scale-150">{topic.icon}</div>
                </div>
                <div className="relative z-10">
                  <div className="mb-2 p-2 bg-white/20 rounded-lg w-fit backdrop-blur-sm">
                    {topic.icon}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{topic.name}</h3>
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {formatCount(topic.count)} 讨论
                  </p>
                </div>
                <Sparkles className="absolute bottom-2 right-2 h-8 w-8 opacity-20 group-hover:opacity-40 transition-opacity" />
              </button>
            ))}
          </div>
        </section>

        {/* 推荐用户 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">推荐关注</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              换一批
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {mockRecommendUsers.map((user: RecommendUser) => (
              <Card
                key={user.id}
                className="flex-shrink-0 w-36 hover-elevate transition-all cursor-pointer"
              >
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Avatar className="h-14 w-14 mb-2 ring-2 ring-primary/10">
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                      {user.nickname.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h4 className="font-medium text-sm truncate w-full">{user.nickname}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 w-full">
                    {user.bio}
                  </p>
                  <Button size="sm" variant="default" className="w-full mt-3 h-7 text-xs"
                    onClick={() => handleFollow(user.id)}>
                    <UserPlus className="h-3 w-3" />
                    关注
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 热门动态 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">热门动态</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              更多
            </Button>
          </div>

          <div className="space-y-3">
            {mockHotPosts.map((post: HotPost, index: number) => (
              <Card key={post.id} className="hover-elevate transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-xs">
                          {post.author.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {index < 3 && (
                        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs flex items-center justify-center font-bold shadow-md">
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{post.author}</span>
                        <span className="text-xs text-muted-foreground">{post.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
