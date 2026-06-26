import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../services/jwt.js";

export const authUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.accessToken;
        
        if (!token) {
            return res.status(401).json({ message: "Vui lòng đăng nhập" });
        }

        const data = verifyToken(token);
        if (!data) {
            return res.status(401).json({ message: "Phiên đăng nhập hết hạn hoặc không hợp lệ" });
        }

        req.user = data;
        return next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Lỗi xác thực người dùng" });
    }
};
