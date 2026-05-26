import { Request, Response } from "express";
import { pool } from "../db";
import { RowDataPacket } from "mysql2";
import { sendServerError, parseId } from "../helpers/response.helper";

export async function getUserPublicProfile(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: "ID không hợp lệ" });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT UserID AS id, Name AS name, Phone AS phone,
              IsVerified AS isVerified, CreatedAt AS createdAt
       FROM User WHERE UserID = ? AND IsActive = 1`,
      [id],
    );
    if (!rows[0])
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    return res.json(rows[0]);
  } catch (err) {
    return sendServerError(res, err);
  }
}
