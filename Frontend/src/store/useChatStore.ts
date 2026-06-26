import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import type { ChatStoreState, Message, User, Conversation } from "../types";

const getErrorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message;

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  friends: [],
  conversations: [],
  selectedUser: null,
  selectedConversation: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getFriends: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get<User[]>("/user/getFriendList");
      set({ friends: res.data });
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to load friends");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getConversations: async () => {
    try {
      const res = await axiosInstance.get<Conversation[]>("/message/getGroup");
      set({ conversations: res.data });
    } catch (error) {
      console.log(error);
    }
  },

  getMessages: async (conversationId: string) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get<Message[]>(`/message/${conversationId}`);
      set({ messages: res.data });
      get().markAsSeen(conversationId);
    } catch (error) {
      toast.error(getErrorMessage(error) || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async ({ text, file }) => {
    const { selectedUser, selectedConversation, messages } = get();
    if (!selectedUser && !selectedConversation) return;

    try {
      const formData = new FormData();
      if (text) formData.append("text", text);
      if (file) formData.append("image", file); // Multer expects 'image' field based on current setup
      
      if (selectedConversation) {
        formData.append("conversationId", selectedConversation._id);
      } else if (selectedUser) {
        formData.append("friendId", selectedUser._id);
      }

      const res = await axiosInstance.post<Message>(`/message/send`, formData);
      
      // If we didn't have a conversation ID before, it means a new one was created
      if (!selectedConversation && res.data.conversationId) {
        // Fetch conversations to find the newly created one
        await get().getConversations();
        const newConv = get().conversations.find(c => c._id === res.data.conversationId);
        if (newConv) {
          set({ selectedConversation: newConv });
          useAuthStore.getState().socket?.emit("joinConversation", newConv._id);
        }
      }

      // Important: Only add the message to state if it hasn't been added yet (e.g. by socket event)
      const { messages: currentMessages } = get();
      if (!currentMessages.some(m => m._id === res.data._id)) {
        set({ messages: [...currentMessages, res.data] });
      }
      
      // Update conversations list so new ones appear
      get().getConversations();
    } catch (error) {
      console.log(error);
      toast.error(getErrorMessage(error) || "Failed to send message");
    }
  },

  createGroup: async (title: string, friendId: string[]) => {
    try {
      const res = await axiosInstance.post<{message: string, data: Conversation}>("/message/createGroup", { title, friendId });
      toast.success(res.data.message);
      set({ conversations: [...get().conversations, res.data.data] });
    } catch(err) {
      toast.error(getErrorMessage(err) || "Failed to create group");
    }
  },

  markAsSeen: async (conversationId: string) => {
    try {
      await axiosInstance.post("/message/markSeen", { conversationId });
    } catch(err) {
      console.log(err);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", async (newMessage: Message) => {
      const { selectedConversation, selectedUser, messages } = get();
      
      let shouldAddMessage = false;

      // Trường hợp 1: Đã có cuộc hội thoại đang mở
      if (selectedConversation && newMessage.conversationId === selectedConversation._id) {
        shouldAddMessage = true;
      } 
      // Trường hợp 2: Chưa có cuộc hội thoại (tin nhắn đầu tiên) nhưng đang mở đúng cửa sổ chat với người gửi
      else if (!selectedConversation && selectedUser && newMessage.senderId === selectedUser._id) {
        shouldAddMessage = true;
        // Cập nhật lại danh sách cuộc hội thoại để lấy object conversation mới
        await get().getConversations();
        const newConv = get().conversations.find(c => c._id === newMessage.conversationId);
        if (newConv) {
          set({ selectedConversation: newConv });
          useAuthStore.getState().socket?.emit("joinConversation", newConv._id);
        }
      }
      
      if (shouldAddMessage) {
        const isDuplicate = get().messages.some(m => m._id === newMessage._id);
        if (!isDuplicate) {
          set({ messages: [...get().messages, newMessage] });
          get().markAsSeen(newMessage.conversationId);
        }
      }
      
      // Luôn làm mới danh sách cuộc hội thoại để cập nhật preview tin nhắn cuối ở sidebar
      get().getConversations();
    });

    socket.on("messageSeen", ({ conversationId, myId }: { conversationId: string, myId: string }) => {
      const { selectedConversation, messages } = get();
      if (selectedConversation && conversationId === selectedConversation._id) {
        const updatedMessages = messages.map(m => {
          if (!m.seenBy.includes(myId)) {
            return { ...m, seenBy: [...m.seenBy, myId] };
          }
          return m;
        });
        set({ messages: updatedMessages });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
    socket?.off("messageSeen");
  },

  setSelectedUser: (selectedUser) => {
    const { conversations, selectedConversation } = get();
    const socket = useAuthStore.getState().socket;

    // Leave old room
    if (selectedConversation) {
      socket?.emit("leaveConversation", selectedConversation._id);
    }

    const existingConversation = conversations.find(c => !c.isGroup && c.participants.some(p => p._id === selectedUser?._id));
    set({ selectedUser, selectedConversation: existingConversation || null });
    
    if(existingConversation) {
      get().getMessages(existingConversation._id);
      socket?.emit("joinConversation", existingConversation._id);
    } else {
      set({ messages: [] });
    }
  },

  setSelectedConversation: (selectedConversation) => {
    const { selectedConversation: oldConversation } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    // Leave old room
    if (oldConversation) {
      socket?.emit("leaveConversation", oldConversation._id);
    }

    const selectedUser =
      selectedConversation && !selectedConversation.isGroup
        ? selectedConversation.participants.find((participant) => participant._id !== authUser?._id) || null
        : null;

    set({ selectedConversation, selectedUser });
    if(selectedConversation) {
      get().getMessages(selectedConversation._id);
      socket?.emit("joinConversation", selectedConversation._id);
    } else {
      set({ messages: [] });
    }
  }
}));
