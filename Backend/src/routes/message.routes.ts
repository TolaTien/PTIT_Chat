import { Router } from "express";

import  Message  from '../controllers/message.controllers.js';
import { authUser } from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/upload.middlewares.js";

export const messageRouters: Router = Router();

messageRouters.post('/createGroup', authUser, Message.createGroup);
messageRouters.get('/getGroup', authUser, Message.getGroup);
messageRouters.get('/:conversationId', authUser, Message.getMessages);
messageRouters.post('/send', authUser, upload.single("image"), Message.sendMessage);
messageRouters.post('/markSeen', authUser, Message.markAsSeen);


