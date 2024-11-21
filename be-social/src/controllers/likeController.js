

import Like from '../models/likeModel.js';
import Post from '../models/postModel.js';
import mongoose from 'mongoose';

// Получение лайков для поста
export const getPostLikes = async (req, res) => {
  const { postId } = req.params;

  // Проверка на валидность ID поста
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ error: "Invalid post ID format" });
  }

  try {
    const likes = await Like.find({ post_id: postId });
    res.status(200).json(likes);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении лайков', details: error.message });
  }
};

// Лайк поста
export const likePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id; // Используем `userId` из `req.user`

  console.log("Received postId:", postId);
  console.log("Received userId:", userId);

  try {
    const post = await Post.findById(postId);
    if (!post) {
      console.log("Post not found");
      return res.status(404).json({ error: 'Пост не найден' });
    }

    const existingLike = await Like.findOne({ post_id: postId, user_id: userId });
    if (existingLike) {
      console.log("Like already exists");
      return res.status(400).json({ error: 'Пост уже лайкнут' });
    }

    const like = new Like({ post_id: postId, user_id: userId });
    await like.save();
    console.log("Like created:", like);

    post.likes_count += 1;
    await post.save();
    console.log("Post updated with new like count:", post.likes_count);

    res.status(201).json(like);
  } catch (error) {
    console.error("Error in likePost:", error);
    res.status(500).json({ error: 'Ошибка при лайке поста', details: error.message });
  }
};

export const unlikePost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id; // Используем `userId` из `req.user`

  try {
    const like = await Like.findOne({ post_id: postId, user_id: userId });
    if (!like) return res.status(404).json({ error: 'Лайк не найден' });

    await Like.findByIdAndDelete(like._id);

    const post = await Post.findById(postId);
    post.likes_count = Math.max(0, post.likes_count - 1);
    await post.save();

    res.status(200).json({ message: 'Лайк удалён' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении лайка', details: error.message });
  }
};
