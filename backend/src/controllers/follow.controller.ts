import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

export async function toggleFollow(req: Request, res: Response) {
  const followerId = (req as any).user.userId;
  const sellerId = parseInt(req.params.sellerId);

  if (!sellerId) {
    return res.status(400).json({ message: 'Thiếu ID người bán' });
  }
  if (followerId === sellerId) {
    return res.status(400).json({ message: 'Không thể tự follow chính mình' });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT FollowID FROM Follow WHERE FollowerID = ? AND SellerID = ?',
      [followerId, sellerId]
    );

    if (rows.length > 0) {
      // Đã follow -> Hủy follow
      await pool.query('DELETE FROM Follow WHERE FollowID = ?', [rows[0].FollowID]);
      return res.json({ message: 'Đã hủy theo dõi', isFollowing: false });
    } else {
      // Chưa follow -> Thêm follow
      await pool.query(
        'INSERT INTO Follow (FollowerID, SellerID) VALUES (?, ?)',
        [followerId, sellerId]
      );
      return res.json({ message: 'Đã theo dõi thành công', isFollowing: true });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export async function checkFollow(req: Request, res: Response) {
  const followerId = (req as any).user.userId;
  const sellerId = parseInt(req.params.sellerId);

  if (!sellerId) {
    return res.status(400).json({ message: 'Thiếu ID người bán' });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT FollowID FROM Follow WHERE FollowerID = ? AND SellerID = ?',
      [followerId, sellerId]
    );
    return res.json({ isFollowing: rows.length > 0 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}
