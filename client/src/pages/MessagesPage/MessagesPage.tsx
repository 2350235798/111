import React, { useState } from 'react';
import { logger } from '@client/src/utils/logger';
import {
  Bell,
  MessageSquare,
  Heart,
  MessageCircle,
  UserPlus,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@client/src/components/ui/tabs';
import { Card, CardContent } from '@client/src/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@client/src/components/ui/avatar';
import { Badge } from '@client/src/components/ui/badge';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia, EmptyContent } from '@client/src/components/ui/empty';

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'system';
  userName: string;
  avatarUrl: string;
  content: string;
  time: string;
  isRead: boolean;
  postPreview?: string;
}

interface ChatItem {
  id: string;
  userName: string;
  avatarUrl: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'like',
    userName: '学霸小明',
    avatarUrl: '',
    content: '赞了你的动态',
    time: '刚刚',
    isRead: false,
    postPreview: '今天图书馆学习10小时打卡！高数终于搞懂了...',
  },
  {
    id: '2',
    type: 'comment',
    userName: '美食达人',
    avatarUrl: '',
    content: '评论了你的动态："请问这家店具体在哪呀？想去打卡！"',
    time: '10分钟前',
    isRead: false,
    postPreview: '学校西门新开的那家火锅店真的绝了！',
  },
  {
    id: '3',
    type: 'follow',
    userName: '摄影小白',
    avatarUrl: '',
    content: '关注了你',
    time: '1小时前',
    isRead: false,
  },
  {
    id: '4',
    type: 'system',
    userName: '系统通知',
    avatarUrl: '',
    content: '你的帖子"考研经验分享"已通过审核，快去看看吧~',
    time: '2小时前',
    isRead: true,
  },
  {
    id: '5',
    type: 'like',
    userName: '健身少女',
    avatarUrl: '',
    content: '赞了你的评论',
    time: '3小时前',
    isRead: true,
  },
  {
    id: '6',
    type: 'comment',
    userName: '考研上岸',
    avatarUrl: '',
    content: '回复了你："谢谢分享！请问英语怎么复习比较好？"',
    time: '5小时前',
    isRead: true,
  },
  {
    id: '7',
    type: 'system',
    userName: '系统通知',
    avatarUrl: '',
    content: '欢迎加入校园社区！快来完善你的个人资料吧',
    time: '昨天',
    isRead: true,
  },
];

const mockChats: ChatItem[] = [
  {
    id: '1',
    userName: '学霸小明',
    avatarUrl: '',
    lastMessage: '好的，那明天图书馆见！',
    time: '12:30',
    unreadCount: 2,
  },
  {
    id: '2',
    userName: '美食达人',
    avatarUrl: '',
    lastMessage: '你说的那家店我去过了，真的超好吃！',
    time: '昨天',
    unreadCount: 0,
  },
  {
    id: '3',
    userName: '摄影小白',
    avatarUrl: '',
    lastMessage: '[图片]',
    time: '昨天',
    unreadCount: 5,
  },
  {
    id: '4',
    userName: '考研上岸',
    avatarUrl: '',
    lastMessage: '加油！我们一定能上岸的💪',
    time: '周一',
    unreadCount: 0,
  },
  {
    id: '5',
    userName: '吉他小王子',
    avatarUrl: '',
    lastMessage: '周末社团有演出，来看吗？',
    time: '周日',
    unreadCount: 1,
  },
];

function getNotificationIcon(type: string) {
  switch (type) {
    case 'like':
      return <Heart className="h-4 w-4 text-rose-500" />;
    case 'comment':
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case 'follow':
      return <UserPlus className="h-4 w-4 text-emerald-500" />;
    case 'system':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

function getNotificationBg(type: string) {
  switch (type) {
    case 'like':
      return 'bg-rose-50';
    case 'comment':
      return 'bg-blue-50';
    case 'follow':
      return 'bg-emerald-50';
    case 'system':
      return 'bg-amber-50';
    default:
      return 'bg-muted';
  }
}

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<string>('notifications');

  React.useEffect(() => {
    logger.info({ args: ['MessagesPage mounted'] });
  }, []);

  const handleNotificationClick = (item: NotificationItem) => {
    logger.info({ args: ['查看通知', item.id] });
  };

  const handleChatClick = (chat: ChatItem) => {
    logger.info({ args: ['打开私信', chat.id] });
  };

  const unreadNotificationCount = mockNotifications.filter((n: NotificationItem) => !n.isRead).length;
  const unreadChatCount = mockChats.reduce((sum: number, c: ChatItem) => sum + c.unreadCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">消息中心</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="notifications" className="relative">
                <Bell className="h-4 w-4" />
                通知
                {unreadNotificationCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold text-white bg-destructive rounded-full">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="chats">
                <MessageSquare className="h-4 w-4" />
                私信
                {unreadChatCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold text-white bg-destructive rounded-full">
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="mt-0">
            {mockNotifications.length === 0 ? (
              <div className="p-8">
                <Empty>
                  <EmptyMedia variant="icon">
                    <Bell />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>暂无通知</EmptyTitle>
                    <EmptyDescription>暂时还没有新的通知消息</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {mockNotifications.map((item: NotificationItem) => (
                  <Card
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`cursor-pointer hover-elevate transition-all ${!item.isRead ? 'ring-1 ring-primary/20 bg-primary/[0.02]' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={item.avatarUrl} />
                            <AvatarFallback className={`${getNotificationBg(item.type)} text-xs`}>
                              {item.type === 'system' ? (
                                <AlertCircle className="h-5 w-5 text-amber-600" />
                              ) : (
                                item.userName.slice(0, 2)
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {!item.isRead && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                          )}
                          <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ${getNotificationBg(item.type)} ring-2 ring-background`}>
                            {getNotificationIcon(item.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-medium text-sm">{item.userName}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.content}
                          </p>
                          {item.postPreview && (
                            <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs text-muted-foreground line-clamp-1">
                              {item.postPreview}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chats" className="mt-0">
            {mockChats.length === 0 ? (
              <div className="p-8">
                <Empty>
                  <EmptyMedia variant="icon">
                    <MessageSquare />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>暂无私信</EmptyTitle>
                    <EmptyDescription>还没有人给你发过私信</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </div>
            ) : (
              <div className="p-4 space-y-1">
                {mockChats.map((chat: ChatItem) => (
                  <div
                    key={chat.id}
                    onClick={() => handleChatClick(chat)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={chat.avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-sm">
                          {chat.userName.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {chat.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                          {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{chat.userName}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{chat.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
