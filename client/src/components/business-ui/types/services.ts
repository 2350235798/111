/**
 * 业务 UI 组件使用的服务类型定义
 * 替代原本从 @lark-apaas/client-toolkit/tools/services 导入的类型
 *
 * 注意：本文件只定义类型桩，不包含运行时实现。
 */

import type { I18nText } from '@client/src/components/business-ui/entity-combobox/types';
import type { UserType } from '@client/src/components/business-ui/types/user';

// ===== AccountType =====

export type AccountType =
  | 'user'
  | 'department'
  | 'chat'
  | 'apaas'
  | 'lark';

// ===== UserInfo =====

export interface UserInfo {
  /** 平台用户 ID（未注册外部联系人可能为空） */
  userID?: string;
  /** 飞书 open_id */
  larkUserID?: string;
  /** 用户名称（国际化文本） */
  name: I18nText;
  /** 英文名 */
  enName?: string;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  mobile?: string;
  /** 工号 */
  employeeId?: string;
  /** 职位 */
  title?: string;
  /** 用户类型 */
  userType?: UserType;
  /** 部门信息 */
  department?: unknown;
  /** 部门 ID 列表 */
  departmentIds?: string[];
  /** 租户名称（外部联系人显示用） */
  tenantName?: string;
}

// ===== SearchAvatar =====
// 用于 listUsersByIds 返回的头像嵌套结构
// 用法：UserInfo & SearchAvatar → 头像为嵌套对象结构

export interface SearchAvatar {
  avatar: {
    image: {
      large: string;
      medium?: string;
      small?: string;
    };
  };
}

// ===== DepartmentInfo =====

export interface DepartmentInfo {
  /** 部门 ID（平台侧） */
  departmentID: string;
  /** 飞书部门 ID */
  larkDepartmentID?: string;
  /** 部门名称（国际化文本） */
  name: I18nText;
  /** 父部门 ID */
  parentId?: string;
  /** 成员数量 */
  memberCount?: number;
  /** 子部门数量 */
  childrenCount?: number;
}

// ===== ChatInfo =====

export interface ChatInfo {
  /** 群组 ID */
  chatID: string;
  /** 群组名称（国际化文本） */
  name: I18nText;
  /** 头像：URL 或 16 进制 RGB 颜色 */
  avatar: string;
  /** 群成员数量 */
  memberCount?: number;
  /** 群类型 */
  chatType?: 'group' | 'p2p';
  /** 是否是外部群 */
  isExternal?: boolean;
  /** 群成员数量（不包括机器人，与 memberCount 二选一） */
  userCount?: number;
}

// ===== 请求/响应类型 =====

export interface SearchUsersParams {
  query: string;
  pageSize?: number;
  searchExternalContact?: boolean;
  accountType?: AccountType;
}

export interface SearchUsersResponse {
  data: {
    userList: UserInfo[];
    hasMore?: boolean;
    pageToken?: string;
  };
}

export interface BatchGetUsersResponse {
  data: {
    userInfoMap: Record<string, UserInfo & SearchAvatar>;
  };
}

export interface ConvertExternalContactResponse {
  data: {
    userID?: string;
    larkUserID?: string;
    success?: boolean;
    userInfo?: UserInfo;
  };
}

export interface SearchChatsParams {
  query: string;
  pageSize?: number;
  pageToken?: string;
}

export interface SearchChatsResponse {
  data: {
    result: {
      chatResult: {
        items: ChatInfo[];
        hasMore?: boolean;
        pageToken?: string;
      };
    };
  };
}

export interface BatchGetChatsResponse {
  data: {
    chatInfoMap?: Record<string, ChatInfo>;
    chatList?: ChatInfo[];
  };
}

export interface SearchDepartmentsParams {
  query: string;
  pageSize?: number;
}

export interface SearchDepartmentsResponse {
  data: {
    departmentList: DepartmentInfo[];
    hasMore?: boolean;
    pageToken?: string;
  };
}

// ===== UserProfileData =====

export interface UserProfileData {
  useLarkCard: boolean;
  userProfileInfo?: {
    name?: string;
    avatar?: string;
    email?: string;
    userStatus: number;
    userType: '_employee' | '_externalUser';
  };
  larkCardParam?: {
    needRedirect?: boolean;
    redirectURL?: string;
    larkAppID: string;
    jsAPITicket: string;
    larkOpenID: string;
    targetLarkOpenID: string;
  };
}

// ===== 工具函数 =====

export function getAssetsUrl(path: string): string {
  return path;
}

// ===== 服务类（桩实现） =====
// 仅用于类型兼容，不包含真实业务逻辑
// 实际运行时由 @lark-apaas/client-toolkit 提供实现

export class UserService {
  searchUsers(_params: SearchUsersParams): Promise<SearchUsersResponse> {
    return Promise.resolve({ data: { userList: [] } });
  }

  listUsersByIds(_userIds: string[]): Promise<BatchGetUsersResponse> {
    return Promise.resolve({ data: { userInfoMap: {} } });
  }

  convertExternalContact(
    _larkUserID: string,
  ): Promise<ConvertExternalContactResponse> {
    return Promise.resolve({ data: {} });
  }
}

export class ChatService {
  searchChats(_params: SearchChatsParams): Promise<SearchChatsResponse> {
    return Promise.resolve({
      data: { result: { chatResult: { items: [] } } },
    });
  }

  listChatsByIds(_chatIds: string[]): Promise<BatchGetChatsResponse> {
    return Promise.resolve({ data: { chatInfoMap: {} } });
  }
}

export class DepartmentService {
  searchDepartments(
    _params: SearchDepartmentsParams,
  ): Promise<SearchDepartmentsResponse> {
    return Promise.resolve({ data: { departmentList: [] } });
  }
}

export class UserProfileService {
  getUserProfile(
    _userId: string,
    _accountType: AccountType,
    _signal?: AbortSignal,
  ): Promise<UserProfileData> {
    return Promise.resolve({ useLarkCard: false });
  }
}
