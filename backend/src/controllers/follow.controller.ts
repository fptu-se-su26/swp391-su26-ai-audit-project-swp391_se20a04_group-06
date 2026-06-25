import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
<<<<<<< HEAD

export async function toggleFollow(req: Request, res: Response) {
  const followerId = (req as any).user.userId;
  const sellerId = parseInt(req.params.sellerId);

  if (!sellerId) {
    return res.status(400).json({ message: 'Thiếu ID người bán' });
  }
  if (followerId === sellerId) {
    return res.status(400).json({ message: 'Không thể tự follow chính mình' });
  }
=======
import { sendServerError, parseId } from '../helpers/response.helper';

export async function toggleFollow(req: Request, res: Response) {
  const { userId: followerId } = req.user;
  const sellerId = parseId(req.params.sellerId);

  if (!sellerId) return res.status(400).json({ message: 'ID người bán không hợp lệ' });
  if (followerId === sellerId) return res.status(400).json({ message: 'Không thể tự follow chính mình' });
>>>>>>> origin/main

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT FollowID FROM Follow WHERE FollowerID = ? AND SellerID = ?',
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
  }
}

export async function checkFollow(req: Request, res: Response) {
<<<<<<< HEAD
  const followerId = (req as any).user.userId;
  const sellerId = parseInt(req.params.sellerId);

  if (!sellerId) {
    return res.status(400).json({ message: 'Thiếu ID người bán' });
  }
=======
  const { userId: followerId } = req.user;
  const sellerId = parseId(req.params.sellerId);

  if (!sellerId) return res.status(400).json({ message: 'ID người bán không hợp lệ' });
>>>>>>> origin/main

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT FollowID FROM Follow WHERE FollowerID = ? AND SellerID = ?',
<<<<<<< HEAD
      [followerId, sellerId]
    );
    return res.json({ isFollowing: rows.length > 0 });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
=======
      [followerId, sellerId],
    );
    return res.json({ isFollowing: rows.length > 0 });
  } catch (err) {
    return sendServerError(res, err);
>>>>>>> origin/main
  }
}
