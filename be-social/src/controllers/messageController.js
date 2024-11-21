// controllers/messageController.js

import Message from "../models/messageModel.js";

export const loadMessages = async (userId, targetUserId, socket) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender_id: userId, receiver_id: targetUserId },
        { sender_id: targetUserId, receiver_id: userId },
      ],
    }).sort({ created_at: 1 });

    socket.emit("loadMessages", messages);
  } catch (error) {
    socket.emit("error", { error: "Ошибка при загрузке сообщений" });
  }
};

export const sendMessage = async (
  userId,
  targetUserId,
  messageText,
  roomId,
  io
) => {
  try {
    const message = new Message({
      sender_id: userId,
      receiver_id: targetUserId,
      message_text: messageText,
      created_at: new Date(),
    });

    await message.save();
    io.to(roomId).emit("receiveMessage", message);
  } catch (error) {
    console.error("Ошибка при отправке сообщения:", error);
  }
};
// Получение времени последнего сообщения для каждого пользователя
export const getLastMessageDate = async (req, res) => {
  const { userId } = req.params;
  const authUserId = req.user._id;

  try {
   

    // Находим последнее сообщение между authUserId и userId
    const lastMessage = await Message.findOne({
      $or: [
        { sender_id: authUserId, receiver_id: userId },
        { sender_id: userId, receiver_id: authUserId },
      ],
    })
      .sort({ created_at: -1 }) // Сортируем по дате создания (новые сверху)
      .select("created_at"); // Получаем только поле created_at

    // Возвращаем дату последнего сообщения
    res
      .status(200)
      .json({ lastMessageDate: lastMessage ? lastMessage.created_at : null });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Ошибка получения времени последнего сообщения",
        error: error.message,
      });
  }
};
// Новый метод для получения последнего сообщения между двумя пользователями
export const getLastMessageBetweenUsers = async (req, res) => {
  const { userId } = req.params;
  const authUserId = req.user._id;

  try {
    const lastMessage = await Message.findOne({
      $or: [
        { sender_id: authUserId, receiver_id: userId },
        { sender_id: userId, receiver_id: authUserId }
      ]
    })
      .sort({ created_at: -1 }) // Получаем последнее сообщение (новейшее)
      .select("created_at message_text"); // Выбираем только необходимые поля

      res.status(200).json({
        lastMessageDate: lastMessage ? lastMessage.created_at : null,
        lastMessageText: lastMessage ? lastMessage.message_text : null,
      });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения последнего сообщения', error: error.message });
  }
};