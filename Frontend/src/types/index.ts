import type { Socket } from "socket.io-client";

export interface User {
  _id: string;
  fullName: string;
  email?: string;
  phone?: string;
  avt?: string;
  userName?: string;
  createdAt?: string;
  friendList?: string[];
  friendRequests?: string[] | User[];
}

export interface Conversation {
  _id: string;
  title: string | null;
  isGroup: boolean;
  participants: User[];
  groupAdmin: string | null;
  lastMessage: string;
  avt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  senderId: string;
  conversationId: string;
  text?: string;
  image?: string;
  video?: string;
  file?: string;
  fileName?: string;
  seenBy: string[];
  createdAt: string;
}

export interface FriendRequest {
  _id: string;
  senderId: User;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
}

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthStoreState {
  authUser: User | null;
  isSigningUp: boolean;
  isLoggingIn: boolean;
  isUpdatingProfile: boolean;
  isCheckingAuth: boolean;
  onlineUsers: string[];
  socket: Socket | null;
  friendRequests: FriendRequest[];
  isSearchingUsers: boolean;
  searchResults: User[];
  checkAuth: () => Promise<void>;
  signup: (data: SignupPayload) => Promise<void>;
  login: (data: LoginPayload) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  sendOTP: (email: string) => Promise<boolean>;
  resendOTP: (email: string) => Promise<boolean>;
  verifyOTP: (data: { email: string; otp: string }) => Promise<boolean>;
  resetPassword: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: FormData) => Promise<void>;
  connectSocket: () => void;
  disconnectSocket: () => void;
  searchUsers: (fullName: string) => Promise<void>;
  sendFriendRequest: (friendId: string) => Promise<void>;
  acceptFriendRequest: (friendId: string) => Promise<void>;
  rejectFriendRequest: (friendId: string) => Promise<void>;
  getFriendRequests: () => Promise<void>;
  unfriend: (friendId: string) => Promise<void>;
}

export interface ChatStoreState {
  messages: Message[];
  friends: User[];
  conversations: Conversation[];
  selectedUser: User | null;
  selectedConversation: Conversation | null;
  isUsersLoading: boolean;
  isMessagesLoading: boolean;
  getFriends: () => Promise<void>;
  getConversations: () => Promise<void>;
  getMessages: (conversationId: string) => Promise<void>;
  sendMessage: (payload: { text?: string; file?: File | null }) => Promise<void>;
  subscribeToMessages: () => void;
  unsubscribeFromMessages: () => void;
  setSelectedUser: (user: User | null) => void;
  setSelectedConversation: (conversation: Conversation | null) => void;
  createGroup: (title: string, friendId: string[]) => Promise<void>;
  markAsSeen: (conversationId: string) => Promise<void>;
}
