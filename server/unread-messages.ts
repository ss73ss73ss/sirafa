import { Request, Response, NextFunction, Express } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

// JWT Secret Key
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required for security');
  }
  return secret;
})();

// التحقق من وجود المستخدم المصادق
export async function ensureAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "غير مصرح به" });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "المستخدم غير موجود" });
    }
    
    // @ts-ignore
    req.user = user;
    next();
  } catch (error) {
    console.error("خطأ في التحقق من التوكن:", error);
    return res.status(401).json({ message: "توكن غير صالح" });
  }
}

interface AuthRequest extends Request {
  user: {
    id: number;
    email: string;
    type: string;
  };
}

// إعداد مسارات التعامل مع الرسائل غير المقروءة
export function setupUnreadMessagesRoutes(app: Express) {
  
  // واجهة برمجة لجلب عدد الرسائل غير المقروءة في الغرف العامة
  app.get("/api/chat/unread/public", ensureAuth, async (req: AuthRequest, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      
      const result = await db.execute(sql`
        SELECT chat_messages.room_id as "roomId",
               COUNT(chat_messages.id) as "unreadCount"
        FROM chat_messages
        WHERE chat_messages.id NOT IN (
          SELECT message_id FROM chat_message_reads WHERE user_id = ${userId}
        )
        AND chat_messages.sender_id != ${userId}
        AND chat_messages.is_deleted = false
        GROUP BY chat_messages.room_id
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error("خطأ في جلب عدد الرسائل غير المقروءة في الغرف العامة:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء جلب عدد الرسائل غير المقروءة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });
  
  // واجهة برمجة لجلب عدد الرسائل غير المقروءة في المحادثات الخاصة
  app.get("/api/chat/unread/private", ensureAuth, async (req: AuthRequest, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      
      const result = await db.execute(sql`
        SELECT private_messages.chat_id as "chatId",
               COUNT(private_messages.id) as "unreadCount"
        FROM private_messages
        JOIN private_chats ON private_messages.chat_id = private_chats.id
        WHERE private_messages.id NOT IN (
          SELECT message_id FROM private_message_reads WHERE user_id = ${userId}
        )
        AND private_messages.sender_id != ${userId}
        AND private_messages.is_deleted = false
        AND (private_chats.user1_id = ${userId} OR private_chats.user2_id = ${userId})
        GROUP BY private_messages.chat_id
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error("خطأ في جلب عدد الرسائل غير المقروءة في المحادثات الخاصة:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء جلب عدد الرسائل غير المقروءة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });
  
  // واجهة برمجة لجلب عدد الرسائل غير المقروءة في مجموعات الدردشة
  app.get("/api/chat/unread/groups", ensureAuth, async (req: AuthRequest, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      
      const result = await db.execute(sql`
        SELECT group_messages.group_id as "groupId",
               COUNT(group_messages.id) as "unreadCount"
        FROM group_messages
        JOIN group_members ON group_messages.group_id = group_members.group_id
        WHERE group_messages.id NOT IN (
          SELECT message_id FROM group_message_reads WHERE user_id = ${userId}
        )
        AND group_messages.sender_id != ${userId}
        AND group_messages.is_deleted = false
        AND group_members.user_id = ${userId}
        GROUP BY group_messages.group_id
      `);
      
      res.json(result.rows);
    } catch (error) {
      console.error("خطأ في جلب عدد الرسائل غير المقروءة في مجموعات الدردشة:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء جلب عدد الرسائل غير المقروءة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });

  // واجهة برمجة لتعيين الرسائل كمقروءة في الغرفة العامة
  app.post("/api/chat/mark-read/:roomId", ensureAuth, async (req: AuthRequest, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const { roomId } = req.params;
      
      // جلب الرسائل غير المقروءة في الغرفة
      const unreadMessages = await db.execute(sql`
        SELECT id FROM chat_messages
        WHERE room_id = ${parseInt(roomId)}
        AND id NOT IN (
          SELECT message_id FROM chat_message_reads WHERE user_id = ${userId}
        )
        AND sender_id != ${userId}
      `);
      
      const messageIds = unreadMessages.rows.map((row: any) => row.id);
      
      if (messageIds.length > 0) {
        // إدخال سجلات القراءة للرسائل غير المقروءة
        for (const messageId of messageIds) {
          await db.execute(sql`
            INSERT INTO chat_message_reads (message_id, user_id, read_at)
            VALUES (${messageId}, ${userId}, NOW())
            ON CONFLICT (message_id, user_id) DO NOTHING
          `);
        }
      }
      
      res.json({ success: true, markedCount: messageIds.length });
    } catch (error) {
      console.error("خطأ في تعيين الرسائل كمقروءة في الغرفة العامة:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء تعيين الرسائل كمقروءة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });
  
  // واجهة برمجة لتعيين الرسائل كمقروءة في المحادثة الخاصة
  app.post("/api/chat/private/:chatId/mark-read", ensureAuth, async (req: AuthRequest, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const { chatId } = req.params;
      
      // جلب الرسائل غير المقروءة في المحادثة
      const unreadMessages = await db.execute(sql`
        SELECT id FROM private_messages
        WHERE chat_id = ${parseInt(chatId)}
        AND id NOT IN (
          SELECT message_id FROM private_message_reads WHERE user_id = ${userId}
        )
        AND sender_id != ${userId}
      `);
      
      const messageIds = unreadMessages.rows.map((row: any) => row.id);
      
      if (messageIds.length > 0) {
        // إدخال سجلات القراءة للرسائل غير المقروءة
        for (const messageId of messageIds) {
          await db.execute(sql`
            INSERT INTO private_message_reads (message_id, user_id, read_at)
            VALUES (${messageId}, ${userId}, NOW())
            ON CONFLICT (message_id, user_id) DO NOTHING
          `);
        }
      }
      
      res.json({ success: true, markedCount: messageIds.length });
    } catch (error) {
      console.error("خطأ في تعيين الرسائل كمقروءة في المحادثة الخاصة:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء تعيين الرسائل كمقروءة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });
  
  // واجهة برمجة لتعيين الرسائل كمقروءة في مجموعة الدردشة
  app.post("/api/chat/groups/:groupId/mark-read", ensureAuth, async (req: AuthRequest, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const { groupId } = req.params;
      
      // جلب الرسائل غير المقروءة في المجموعة
      const unreadMessages = await db.execute(sql`
        SELECT id FROM group_messages
        WHERE group_id = ${parseInt(groupId)}
        AND id NOT IN (
          SELECT message_id FROM group_message_reads WHERE user_id = ${userId}
        )
        AND sender_id != ${userId}
      `);
      
      const messageIds = unreadMessages.rows.map((row: any) => row.id);
      
      if (messageIds.length > 0) {
        // إدخال سجلات القراءة للرسائل غير المقروءة
        for (const messageId of messageIds) {
          await db.execute(sql`
            INSERT INTO group_message_reads (message_id, user_id, read_at)
            VALUES (${messageId}, ${userId}, NOW())
            ON CONFLICT (message_id, user_id) DO NOTHING
          `);
        }
      }
      
      res.json({ success: true, markedCount: messageIds.length });
    } catch (error) {
      console.error("خطأ في تعيين الرسائل كمقروءة في مجموعة الدردشة:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء تعيين الرسائل كمقروءة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });

  // واجهة برمجة لإضافة سجل قراءة عند عرض رسالة جديدة
  app.post("/api/chat/message-read/:messageType/:messageId", ensureAuth, async (req: Request, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      const { messageType, messageId } = req.params;
      
      // اختيار الجدول المناسب بناءً على نوع الرسالة
      let tableName = "";
      if (messageType === "public") {
        tableName = "chat_message_reads";
      } else if (messageType === "private") {
        tableName = "private_message_reads";
      } else if (messageType === "group") {
        tableName = "group_message_reads";
      } else {
        return res.status(400).json({ message: "نوع رسالة غير صحيح" });
      }
      
      // إدخال سجل القراءة
      // نستخدم سلسلة SQL محددة بناءً على نوع الرسالة
      if (messageType === "public") {
        await db.execute(sql`
          INSERT INTO chat_message_reads (message_id, user_id, read_at)
          VALUES (${parseInt(messageId)}, ${userId}, NOW())
          ON CONFLICT (message_id, user_id) DO NOTHING
        `);
      } else if (messageType === "private") {
        await db.execute(sql`
          INSERT INTO private_message_reads (message_id, user_id, read_at)
          VALUES (${parseInt(messageId)}, ${userId}, NOW())
          ON CONFLICT (message_id, user_id) DO NOTHING
        `);
      } else if (messageType === "group") {
        await db.execute(sql`
          INSERT INTO group_message_reads (message_id, user_id, read_at)
          VALUES (${parseInt(messageId)}, ${userId}, NOW())
          ON CONFLICT (message_id, user_id) DO NOTHING
        `);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("خطأ في تسجيل قراءة الرسالة:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء تسجيل قراءة الرسالة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });
  
  // واجهة برمجة لتعيين جميع الرسائل كمقروءة (جميع الأنواع)
  app.post("/api/chat/mark-all-read", ensureAuth, async (req: Request, res: Response) => {
    try {
      // @ts-ignore
      const userId = req.user.id;
      
      // 1. تعيين كل الرسائل العامة كمقروءة
      const publicUnreadMessages = await db.execute(sql`
        SELECT id FROM chat_messages
        WHERE id NOT IN (
          SELECT message_id FROM chat_message_reads WHERE user_id = ${userId}
        )
        AND sender_id != ${userId}
      `);
      
      for (const row of publicUnreadMessages.rows) {
        await db.execute(sql`
          INSERT INTO chat_message_reads (message_id, user_id, read_at)
          VALUES (${row.id}, ${userId}, NOW())
          ON CONFLICT (message_id, user_id) DO NOTHING
        `);
      }
      
      // 2. تعيين كل الرسائل الخاصة كمقروءة
      const privateUnreadMessages = await db.execute(sql`
        SELECT pm.id 
        FROM private_messages pm
        JOIN private_chats pc ON pm.chat_id = pc.id
        WHERE pm.id NOT IN (
          SELECT message_id FROM private_message_reads WHERE user_id = ${userId}
        )
        AND pm.sender_id != ${userId}
        AND (pc.user1_id = ${userId} OR pc.user2_id = ${userId})
      `);
      
      for (const row of privateUnreadMessages.rows) {
        await db.execute(sql`
          INSERT INTO private_message_reads (message_id, user_id, read_at)
          VALUES (${row.id}, ${userId}, NOW())
          ON CONFLICT (message_id, user_id) DO NOTHING
        `);
      }
      
      // 3. تعيين كل رسائل المجموعات كمقروءة
      const groupUnreadMessages = await db.execute(sql`
        SELECT gm.id 
        FROM group_messages gm
        JOIN group_members gme ON gm.group_id = gme.group_id
        WHERE gm.id NOT IN (
          SELECT message_id FROM group_message_reads WHERE user_id = ${userId}
        )
        AND gm.sender_id != ${userId}
        AND gme.user_id = ${userId}
      `);
      
      for (const row of groupUnreadMessages.rows) {
        await db.execute(sql`
          INSERT INTO group_message_reads (message_id, user_id, read_at)
          VALUES (${row.id}, ${userId}, NOW())
          ON CONFLICT (message_id, user_id) DO NOTHING
        `);
      }
      
      res.json({ 
        success: true,
        publicCount: publicUnreadMessages.rows.length,
        privateCount: privateUnreadMessages.rows.length,
        groupCount: groupUnreadMessages.rows.length
      });
    } catch (error) {
      console.error("خطأ في تعيين جميع الرسائل كمقروءة:", error);
      res.status(500).json({ 
        message: "حدث خطأ أثناء تعيين جميع الرسائل كمقروءة", 
        error: error instanceof Error ? error.message : "خطأ غير معروف" 
      });
    }
  });
}