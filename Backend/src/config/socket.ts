import { createServer } from "http";
import express from 'express';
import { Server } from "socket.io";


const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", process.env.CLIENT_URL as string],
        credentials: true,
        methods: ["PUT", "POST", "GET", "DELETE", "PATCH"],
    }
})

const onlineUsers = new Map<string, string>();

export const getReceiverSocket = (userId: string) => {
    return onlineUsers.get(userId);

}

io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId as string;
    if (userId) {
        onlineUsers.set(userId, socket.id);
        console.log("A user connected:", userId);
        socket.join(userId);
    }


    io.emit("getOnlineUsers", Array.from(onlineUsers.keys()))


    socket.on("joinConversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${userId} joined room: ${conversationId}`);
    });


    socket.on("leaveConversation", (conversationId) => {
        socket.leave(conversationId);
        console.log(`User ${userId} left room: ${conversationId}`);
    });

    socket.on("disconnect", () => {
        if (userId) {
            onlineUsers.delete(userId);
            io.emit("getOnlineUsers", Array.from(onlineUsers.keys()))
        }
        console.log("A user disconnected: ", socket.id)
    })
});

export {io, server, app};