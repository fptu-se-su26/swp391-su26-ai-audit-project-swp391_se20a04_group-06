import { Request, Response } from "express";
import { User } from "../models/User";
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getUserPublicProfile(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    return res.json({
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      isVerified: user.isVerified ? 1 : 0,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return sendServerError(res, err);
  }
}
