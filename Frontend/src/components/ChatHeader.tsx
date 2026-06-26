import { X, UserMinus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, selectedConversation, setSelectedUser, setSelectedConversation } = useChatStore();
  const { onlineUsers, authUser, unfriend } = useAuthStore();

  if (!selectedUser && !selectedConversation) return null;

  const isGroup = selectedConversation?.isGroup;
  
  let headerTitle = "Chat";
  let headerPic = "/avatar.png";
  let headerStatus = "";
  
  if (isGroup) {
    headerTitle = selectedConversation.title || "Group Chat";
    headerPic = selectedConversation.avt || "/avatar.png";
    headerStatus = `${selectedConversation.participants.length} members`;
  } else if (selectedUser) {
    headerTitle = selectedUser.fullName;
    headerPic = selectedUser.avt || "/avatar.png";
    headerStatus = onlineUsers.includes(selectedUser._id) ? "Online" : "Offline";
  } else if (selectedConversation) {
     // fallback if selectedUser is null but it's a direct chat
     headerTitle = "Direct Chat";
  }

  const isFriend = selectedUser ? (authUser?.friendList as string[])?.includes(selectedUser._id) : false;

  const handleClose = () => {
    setSelectedUser(null);
    setSelectedConversation(null);
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={headerPic} alt={headerTitle} />
            </div>
          </div>

          <div>
            <h3 className="font-medium">{headerTitle}</h3>
            <p className="text-sm text-base-content/70">
              {headerStatus}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFriend && selectedUser && (
            <button 
              onClick={() => unfriend(selectedUser._id)}
              className="btn btn-ghost btn-sm text-error"
              title="Unfriend"
            >
              <UserMinus className="size-5" />
            </button>
          )}
          <button onClick={handleClose}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;