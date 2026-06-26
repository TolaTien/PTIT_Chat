import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { X, FileText, Download } from "lucide-react";

const getFileName = (fileUrl: string, fileName?: string) => {
  if (fileName?.trim()) return fileName;

  try {
    const pathname = new URL(fileUrl).pathname;
    const fallbackName = decodeURIComponent(pathname.split("/").pop() || "");
    return fallbackName || "Tài liệu";
  } catch {
    return "Tài liệu";
  }
};

const ChatContainer = () => {
  const {
    messages,
    isMessagesLoading,
    selectedUser,
    selectedConversation,
    friends
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: "image" | "video" } | null>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const mappedMessages = useMemo(() => messages ?? [], [messages]);

  const lastSeenByUsers = useMemo(() => {
    if (!selectedConversation) return [];
    
    return selectedConversation.participants
      .filter(p => p._id !== authUser?._id)
      .map(participant => {
        const lastMessage = [...messages].reverse().find(m => m.seenBy.includes(participant._id));
        return { participant, lastMessageId: lastMessage?._id };
      })
      .filter(item => item.lastMessageId);
  }, [messages, selectedConversation, authUser?._id]);

  if (!authUser) return null;
  if (!selectedUser && !selectedConversation) return null;

  const isFriend = selectedUser ? (authUser?.friendList as string[])?.includes(selectedUser._id) : false;

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Only check friend status for direct chat if user is explicitly selected
  if (selectedUser && !selectedConversation?.isGroup && !isFriend) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-4">
          <div className="bg-base-200 p-6 rounded-2xl">
            <h3 className="text-xl font-bold">Not Friends Yet</h3>
            <p className="text-base-content/70 mt-2">
              You need to be friends with <strong>{selectedUser.fullName}</strong> to start chatting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto relative">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {mappedMessages.map((message, idx) => {
          const isOwnMessage = message.senderId === authUser._id;
          const isLast = idx === mappedMessages.length - 1;
          const senderUser = isOwnMessage ? authUser : (selectedConversation?.participants.find(p => p._id === message.senderId) || friends.find(f => f._id === message.senderId) || selectedUser);

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={isLast ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border bg-base-300">
                  <img
                    src={senderUser?.avt || "/avatar.png"}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer hover:opacity-90"
                    onClick={() => setSelectedMedia({ url: message.image!, type: "image" })}
                  />
                )}
                {message.video && (
                  <video
                    src={message.video}
                    className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
                    controls
                    onClick={(e) => {
                        e.preventDefault();
                        setSelectedMedia({ url: message.video!, type: "video" });
                    }}
                  />
                )}
                {message.file && (() => {
                  const displayFileName = getFileName(message.file, message.fileName);

                  return (
                    <div className="bg-base-300 p-3 rounded-lg mb-2 w-[min(18rem,70vw)]">
                      <div className="flex items-center gap-3">
                        <div className="size-11 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="size-6 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={displayFileName}>
                            {displayFileName}
                          </p>
                          <p className="text-xs opacity-60">Tài liệu đính kèm</p>
                        </div>
                      </div>

                      <a
                        href={message.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ghost btn-xs mt-3 w-full"
                        download={displayFileName}
                        title="Tải xuống"
                      >
                        <Download size={16} />
                        Tải xuống
                      </a>
                    </div>
                  );
                })()}
                {message.text && <p>{message.text}</p>}
              </div>
              {lastSeenByUsers.some(item => item.lastMessageId === message._id) && (
                <div className="chat-footer opacity-100 flex gap-1 mt-1">
                  {lastSeenByUsers
                    .filter(item => item.lastMessageId === message._id)
                    .map(item => (
                      <div key={item.participant._id} className="avatar size-4" title={`Seen by ${item.participant.fullName}`}>
                        <img
                          src={item.participant.avt || "/avatar.png"}
                          alt="seen by"
                          className="rounded-full border border-base-300"
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <MessageInput />

      {/* Media Fullscreen Modal */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button 
            className="absolute top-5 right-5 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setSelectedMedia(null)}
          >
            <X size={32} />
          </button>
          
          <div className="max-w-5xl max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === "image" ? (
              <img 
                src={selectedMedia.url} 
                alt="Full preview" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            ) : (
              <video 
                src={selectedMedia.url} 
                className="max-w-full max-h-[90vh] rounded-lg"
                controls
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatContainer;
