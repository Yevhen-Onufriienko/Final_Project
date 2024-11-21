import User from '../models/userModel.js';
import getUserIdFromToken from '../utils/helpers.js';
import { uploadImageToCloudinary } from "../utils/cloudinary.js";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Настройка multer для загрузки изображений
const storage = multer.memoryStorage(); // Сохраняем файл в памяти
const upload = multer({ storage });

// Получение профиля конкретного пользователя по его ID
export const getCurrentUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate({
        path: "posts",
        model: "Post",
        select: "image_url caption created_at",
      });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Ошибка получения профиля текущего пользователя", error: error.message });
  }
};


export const getUserProfile = async (req, res) => {
  const userId = req.params.userId;
  try {
    // Попробуем загрузить пользователя вместе с его постами
    const user = await User.findById(userId)
      .select('-password')
      .populate({
        path: 'posts',
        model: 'Post',
        select: 'image_url caption created_at'
      });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения профиля пользователя', error: error.message });
  }
};

// Обновление профиля текущего пользователя
export const updateUserProfile = async (req, res) => {
  const userId = getUserIdFromToken(req);

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const { username, bio, full_name } = req.body;
    
    // Обновляем данные пользователя, если они переданы
    if (username) user.username = username;
    if (bio) user.bio = bio;
    if (full_name) user.full_name = full_name;

    // Если есть новое изображение профиля
    if (req.file) {
      try {
        const imageUrl = await uploadImageToCloudinary(req.file.buffer);
        user.profile_image = imageUrl; // Сохраняем URL изображения
      } catch (error) {
        console.error("Ошибка загрузки изображения в Cloudinary:", error);
        return res.status(500).json({ message: "Ошибка загрузки изображения" });
      }
    }

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    res.status(500).json({ message: "Ошибка обновления профиля", error: error.message });
  }
};


// Получение всех пользователей
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Исключаем пароль
      .populate({
        path: 'posts', // Указываем поле `posts`, которое хотим "пополнить"
        select: 'image_url caption created_at', // Получаем только нужные поля постов
      });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении пользователей', error: error.message });
  }
};
// Экспорт загрузки для использования в маршрутах
export const uploadProfileImage = upload.single('profile_image');
