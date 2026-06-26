import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "./useChatStore";
import type { AuthStoreState, LoginPayload, SignupPayload, User, FriendRequest } from "../types";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

const getErrorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  friendRequests: [],
  isSearchingUsers: false,
  searchResults: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get<User>("/user/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("checkAuth error:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data: SignupPayload) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post<{ data: { newUser: User, accessToken: string, refreshToken: string } }>("/user/register", data);
      set({ authUser: res.data.data.newUser });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.log(error);
      toast.error(getErrorMessage(error) || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data: LoginPayload) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post<{ user: User }>("/user/login", data);
      set({ authUser: res.data.user });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      console.log(error);
      toast.error(getErrorMessage(error) || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  googleLogin: async (token: string) => {
    try {
      const res = await axiosInstance.post<{ user: User }>("/user/google-login", { token });
      set({ authUser: res.data.user });
      toast.success("Logged in with Google successfully");
      get().connectSocket();
    } catch (error) {
      console.log(error);
      toast.error(getErrorMessage(error) || "Google Login failed");
    }
  },

  sendOTP: async (email: string) => {
    try {
      const res = await axiosInstance.post("/user/send-otp", { email });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to send OTP");
      return false;
    }
  },

  resendOTP: async (email: string) => {
    try {
      const res = await axiosInstance.post("/user/resend-otp", { email });
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to resend OTP");
      return false;
    }
  },

  verifyOTP: async (data: { email: string; otp: string }) => {
    try {
      const res = await axiosInstance.post("/user/verify-otp", data);
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error) || "Invalid or expired OTP");
      return false;
    }
  },

  resetPassword: async (data: any) => {
    try {
      const res = await axiosInstance.post("/user/reset-password", data);
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to reset password");
      return false;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/user/logout");
      get().disconnectSocket();
      set({ authUser: null });
      toast.success("Logged out successfully");
    } catch (error) {
      console.log(error);
      toast.error(getErrorMessage(error) || "Logout failed");
    }
  },

  updateProfile: async (data: FormData) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put<{ data: User }>("/user/update-profile", data);
      set({ authUser: res.data.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("updateProfile error:", error);
      toast.error(getErrorMessage(error) || (error as Error).message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser || socket?.connected) return;

    const newSocket: Socket = io(BASE_URL, {
      auth: {
        userId: authUser._id || authUser.userName,
      },
      withCredentials: true,
    });

    newSocket.connect();
    set({ socket: newSocket });

    newSocket.on("getOnlineUsers", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    newSocket.on("newFriendRequest", (sender: User) => {
      // Refresh requests to get full populated data
      get().getFriendRequests();
      toast.success(`${sender.fullName} sent you a friend request!`);
    });

    newSocket.on("friendRequestAccepted", (friend: User) => {
      toast.success(`${friend.fullName} accepted your friend request!`);
      get().checkAuth();
      useChatStore.getState().getFriends();
      useChatStore.getState().getConversations();
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  searchUsers: async (fullName: string) => {
    set({ isSearchingUsers: true });
    try {
      const res = await axiosInstance.get<{ data: User[] }>(`/user/search?fullName=${fullName}`);
      set({ searchResults: res.data.data });
    } catch (error) {
      toast.error(getErrorMessage(error) || "Search failed");
      set({ searchResults: [] });
    } finally {
      set({ isSearchingUsers: false });
    }
  },

  sendFriendRequest: async (friendId: string) => {
    try {
      await axiosInstance.post("/user/sendRequest", { friendId });
      toast.success("Friend request sent");
      const { searchResults } = get();
      set({
        searchResults: searchResults.map((u) =>
          u._id === friendId
            ? { ...u, friendRequests: [...(u.friendRequests as string[] || []), get().authUser?._id || ""] }
            : u
        ),
      });
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to send friend request");
    }
  },

  acceptFriendRequest: async (friendId: string) => {
    try {
      await axiosInstance.post("/user/acceptRequest", { friendId });
      toast.success("Friend request accepted");
      set({
        friendRequests: get().friendRequests.filter((req) => req.senderId._id !== friendId),
      });
      get().checkAuth();
      useChatStore.getState().getFriends();
      useChatStore.getState().getConversations();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to accept friend request");
    }
  },

  rejectFriendRequest: async (friendId: string) => {
    try {
      await axiosInstance.post("/user/rejectRequest", { friendId });
      toast.success("Friend request rejected");
      set({
        friendRequests: get().friendRequests.filter((req) => req.senderId._id !== friendId),
      });
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to reject friend request");
    }
  },

  getFriendRequests: async () => {
    try {
      const res = await axiosInstance.get<FriendRequest[] | { message: string, data: [] }>("/user/getFriendRequests");
      if (Array.isArray(res.data)) {
        set({ friendRequests: res.data });
      } else {
        set({ friendRequests: [] });
      }
    } catch (error) {
      console.log("getFriendRequests error:", error);
    }
  },

  unfriend: async (friendId: string) => {
    try {
      await axiosInstance.delete("/user/unfriend", { data: { friendId } });
      toast.success("Friend removed");
      get().checkAuth();
      useChatStore.getState().getFriends();
      useChatStore.getState().getConversations();
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to remove friend");
    }
  },
}));
