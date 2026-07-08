import { asc, eq } from "drizzle-orm";
import { db } from "../config/neonDb.js";
import { chatMessages } from "../database/schema/index.js";

export class ChatRepository {
  static async createMessage(messageData) {
    const result = await db
      .insert(chatMessages)
      .values({
        ...messageData,
        messageType: messageData.messageType || "text",
      })
      .returning();
    return result[0];
  }

  static async findMessagesByConsultationId(consultationId) {
    return db
      .select({
        id: chatMessages.id,
        senderId: chatMessages.senderId,
        senderName: chatMessages.senderName,
        senderRole: chatMessages.senderRole,
        text: chatMessages.text,
        messageType: chatMessages.messageType,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.consultationId, consultationId))
      .orderBy(asc(chatMessages.createdAt));
  }
}
