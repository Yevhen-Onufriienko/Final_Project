import Notification from '../models/notificationModel.js';
import Like from '../models/likeModel.js';
import Follow from '../models/followModel.js';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';

// Получение всех уведомлений пользователя
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;

    const likedPosts = await Post.find({ user_id: userId }).select("_id");
    const likedPostIds = likedPosts.map((post) => post._id);

    const likes = await Like.find({ post_id: { $in: likedPostIds } })
      .populate("user_id", "username profile_image")
      .populate("post_id", "image_url")
      .sort({ created_at: -1 });

    const follows = await Follow.find({ followed_user_id: userId })
      .populate("follower_user_id", "username profile_image")
      .sort({ created_at: -1 });

    // Формируем уведомления для лайков
    const likeNotifications = likes.map((like) => ({
      _id: like._id,
      type: "like",
      user: like.user_id,
      post_id: like.post_id, 
      created_at: like.created_at,
    }));

    // Формируем уведомления для подписок
    const followNotifications = follows.map((follow) => ({
      _id: follow._id,
      type: "follow",
      user: follow.follower_user_id,
      created_at: follow.created_at,
    }));

    // Собираем все уведомления в один массив и сортируем их по дате
    const notifications = [...likeNotifications, ...followNotifications].sort(
      (a, b) => b.created_at - a.created_at
    );

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Ошибка при получении уведомлений:", error);
    res.status(500).json({ error: "Ошибка при получении уведомлений" });
  }
};


// Создание нового уведомления
export const createNotification = async (req, res) => {
  const { userId, type, content } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const notification = new Notification({
      user_id: userId,
      type,
      content,
      created_at: new Date(),
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании уведомления' });
  }
};

// Удаление уведомления
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    await Notification.findByIdAndDelete(req.params.notificationId);
    res.status(200).json({ message: 'Уведомление удалено' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении уведомления' });
  }
};

// Обновление статуса уведомления (прочитано/непрочитано)
export const updateNotificationStatus = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Уведомление не найдено' });
    }

    notification.is_read = req.body.is_read;
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении статуса уведомления' });
  }
};