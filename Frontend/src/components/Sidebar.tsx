import React, { useEffect, useMemo, useState } from "react";
import { Users, Search, UserPlus, Check, X, Bell, Plus } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

const Sidebar = () => {
  const { getFriends, friends, conversations, getConversations, selectedUser, selectedConversation, setSelectedUser, setSelectedConversation, isUsersLoading, createGroup } = useChatStore();
  const { 
    onlineUsers, searchUsers, searchResults, isSearchingUsers, 
    sendFriendRequest, friendRequests, getFriendRequests,
    acceptFriendRequest, rejectFriendRequest, authUser
  } = useAuthStore();
  
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRequests, setShowRequests] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "conversations">("conversations");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);

  useEffect(() => {
    getFriends();
    getConversations();
    getFriendRequests();
  }, [getFriends, getConversations, getFriendRequests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchUsers(searchTerm);
    }
  };

  const filteredFriends = useMemo(
    () => (showOnlineOnly ? friends.filter((user) => onlineUsers.includes(user._id)) : friends),
    [showOnlineOnly, friends, onlineUsers]
  );

  const onlineCount = Math.max(onlineUsers.length - 1, 0);

  const handleCreateGroup = async () => {
    if(!groupTitle.trim() || selectedFriendsForGroup.length === 0) return;
    await createGroup(groupTitle, selectedFriendsForGroup);
    setShowCreateGroup(false);
    setGroupTitle("");
    setSelectedFriendsForGroup([]);
    setActiveTab("conversations");
  };

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Contacts</span>
          </div>
          <button 
            onClick={() => setShowRequests(!showRequests)}
            className="relative p-2 hover:bg-base-200 rounded-full transition-colors"
            title="Friend Requests"
          >
            <Bell className="size-5" />
            {friendRequests.length > 0 && (
              <span className="absolute top-0 right-0 size-4 bg-primary text-[10px] text-primary-content flex items-center justify-center rounded-full">
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-2 mb-4 hidden lg:flex">
            <button onClick={() => setActiveTab("conversations")} className={`flex-1 btn btn-sm ${activeTab === 'conversations' ? 'btn-primary' : 'btn-ghost'}`}>Chats</button>
            <button onClick={() => setActiveTab("friends")} className={`flex-1 btn btn-sm ${activeTab === 'friends' ? 'btn-primary' : 'btn-ghost'}`}>Friends</button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-sm input-bordered w-full pl-8"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
          </div>
          <button type="submit" className="btn btn-sm btn-square" disabled={isSearchingUsers}>
            {isSearchingUsers ? <span className="loading loading-spinner loading-xs"></span> : <Search className="size-4" />}
          </button>
        </form>

        {activeTab === "friends" && (
            <div className="mt-3 hidden lg:flex items-center gap-2 justify-between">
                <label className="cursor-pointer flex items-center gap-2">
                    <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={(e) => setShowOnlineOnly(e.target.checked)}
                    className="checkbox checkbox-sm"
                    />
                    <span className="text-sm">Show online</span>
                </label>
                <span className="text-xs text-zinc-500">({onlineCount} online)</span>
            </div>
        )}

        {activeTab === "conversations" && (
            <div className="mt-3 hidden lg:flex items-center gap-2 justify-between">
                <span className="text-sm font-medium">Create Group</span>
                <button onClick={() => setShowCreateGroup(!showCreateGroup)} className="btn btn-xs btn-square btn-ghost">
                    <Plus className="size-4"/>
                </button>
            </div>
        )}
      </div>

      <div className="overflow-y-auto w-full py-3 flex-1">
        {/* Create Group Section */}
        {showCreateGroup && (
            <div className="px-4 mb-4 space-y-2 bg-base-200 p-3 mx-2 rounded-xl hidden lg:block">
                <input type="text" placeholder="Group Title" className="input input-sm w-full" value={groupTitle} onChange={e => setGroupTitle(e.target.value)} />
                <div className="max-h-32 overflow-y-auto space-y-1">
                    {friends.map(friend => (
                        <label key={friend._id} className="flex items-center gap-2 text-sm p-1 hover:bg-base-300 rounded cursor-pointer">
                            <input type="checkbox" className="checkbox checkbox-xs" checked={selectedFriendsForGroup.includes(friend._id)} onChange={(e) => {
                                if(e.target.checked) setSelectedFriendsForGroup([...selectedFriendsForGroup, friend._id]);
                                else setSelectedFriendsForGroup(selectedFriendsForGroup.filter(id => id !== friend._id));
                            }}/>
                            {friend.fullName}
                        </label>
                    ))}
                </div>
                <button onClick={handleCreateGroup} className="btn btn-sm btn-primary w-full">Create</button>
            </div>
        )}

        {/* Friend Requests Section */}
        {showRequests && friendRequests.length > 0 && (
          <div className="px-4 mb-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Requests</h3>
            {friendRequests.map((request) => (
              <div key={request._id} className="flex items-center justify-between p-2 bg-base-200 rounded-lg mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img src={request.senderId.avt || "/avatar.png"} alt="" className="size-8 rounded-full object-cover bg-base-300" />
                  <span className="text-sm font-medium truncate">{request.senderId.fullName}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => acceptFriendRequest(request.senderId._id)} className="btn btn-xs btn-success btn-square">
                    <Check className="size-3" />
                  </button>
                  <button onClick={() => rejectFriendRequest(request.senderId._id)} className="btn btn-xs btn-error btn-square">
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Results Section */}
        {searchTerm && searchResults.length > 0 && (
          <div className="px-4 mb-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Search Results</h3>
            {searchResults.map((user) => {
              const isFriend = (authUser?.friendList as string[])?.includes(user._id);
              const hasSentRequest = (user.friendRequests as string[])?.includes(authUser?._id || "");

              return (
                <div 
                  key={user._id} 
                  onClick={() => {
                    if (isFriend) setSelectedUser(user);
                  }}
                  className={`flex items-center justify-between p-2 hover:bg-base-200 rounded-lg transition-colors cursor-pointer ${selectedUser?._id === user._id ? "bg-base-200" : ""}`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img src={user.avt || "/avatar.png"} alt="" className="size-8 rounded-full object-cover bg-base-300" />
                    <span className="text-sm font-medium truncate">{user.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2 hidden lg:flex">
                    {!isFriend && !hasSentRequest && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); sendFriendRequest(user._id); }}
                        className="btn btn-xs btn-primary btn-square"
                        title="Add Friend"
                      >
                        <UserPlus className="size-3" />
                      </button>
                    )}
                    {hasSentRequest && <span className="text-[10px] text-zinc-500">Sent</span>}
                    {isFriend && <span className="text-[10px] text-success">Friend</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "friends" && (
            <>
            <h3 className="px-5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 hidden lg:block">Friends</h3>
            {filteredFriends.map((user) => (
            <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
            >
                <div className="relative mx-auto lg:mx-0">
                <img
                    src={user.avt || "/avatar.png"}
                    alt={user.fullName}
                    className="size-12 object-cover rounded-full bg-base-300"
                />
                {onlineUsers.includes(user._id) && (
                    <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                    />
                )}
                </div>

                <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
                </div>
            </button>
            ))}

            {filteredFriends.length === 0 && !searchTerm && (
            <div className="text-center text-zinc-500 py-4 text-sm hidden lg:block">No friends found</div>
            )}
            </>
        )}

        {activeTab === "conversations" && (
             <>
             <h3 className="px-5 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 hidden lg:block">Recent</h3>
             {conversations.map((conv) => {
                 let title = conv.title;
                 let pic = conv.avt;
                 let isOnline = false;

                 if (!conv.isGroup) {
                     const otherUser = conv.participants.find(p => p._id !== authUser?._id);
                     title = otherUser?.fullName || "Unknown";
                     pic = otherUser?.avt || "/avatar.png";
                     isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;
                 }

                 return (
                    <button
                        key={conv._id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`
                        w-full p-3 flex items-center gap-3
                        hover:bg-base-300 transition-colors
                        ${selectedConversation?._id === conv._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                        `}
                    >
                        <div className="relative mx-auto lg:mx-0 shrink-0">
                        {conv.isGroup ? (
                             <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center">
                                 <Users className="size-6 text-primary"/>
                             </div>
                        ) : (
                            <img
                                src={pic}
                                alt={title}
                                className="size-12 object-cover rounded-full bg-base-300"
                            />
                        )}
                        
                        {!conv.isGroup && isOnline && (
                            <span
                            className="absolute bottom-0 right-0 size-3 bg-green-500 
                            rounded-full ring-2 ring-zinc-900"
                            />
                        )}
                        </div>

                        <div className="hidden lg:block text-left min-w-0 flex-1">
                            <div className="font-medium truncate">{title}</div>
                            <div className="text-sm text-zinc-400 truncate">
                                {conv.lastMessage || "Started a chat"}
                            </div>
                        </div>
                    </button>
                 )
             })}
             {conversations.length === 0 && (
                <div className="text-center text-zinc-500 py-4 text-sm hidden lg:block">No conversations</div>
             )}
             </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;