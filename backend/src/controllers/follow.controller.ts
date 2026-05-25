import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
import { sendServerError, parseId } from '../helpers/response.helper';

export async function toggleFollow(req: Request, res: Response) {
  const { userId: followerId } = req.user;
  const sellerId = parseId(req.params.sellerId);

  if (!sellerId) return res.status(400).json({ message: 'ID người bán không hợp lệ' });
  if (followerId === sellerId) return res.status(400).json({ message: 'Không thể tự follow chính mình' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT FollowID FROM Follow WHERE FollowerID = ? AND SellerID = ?',
      [followerId, sellerId],
    );

    if (rows.length > 0) {
      await pool.query('DELETE FROM Follow WHERE FollowID = ?', [rows[0].FollowID]);
      return res.json({ message: 'Đã hủy theo dõi', isFollowing: false });
    }

    await pool.query(
      'INSERT INTO Follow (FollowerID, SellerID) VALUES (?, ?)',
      [followerId, sellerId],
    );
    return res.json({ message: 'Đã theo dõi thành công', isFollowing: true });
  } catch (err) {
    return sendServerError(res, err);
  }
}

export async function checkFollow(req: Request, res: Response) {
  const { userId: followerId } = req.user;
  const sellerId = parseId(req.params.sellerId);

  if (!sellerId) return res.status(400).json({ message: 'ID người bán không hợp lệ' });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT FollowID FROM Follow WHERE FollowerID = ? AND SellerID = ?',
      [followerId, sellerId],
    );
    return res.json({ isFollowing: rows.length > 0 });
  } catch (err) {
    return sendServerError(res, err);
  }
}
