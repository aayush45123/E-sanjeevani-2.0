import { Server } from "socket.io";

/*
==================================================
FIXED SOCKET.IO SIGNALING — E-Sanjeevani
Key fix: only ONE side initiates (shouldInitiate flag)
Both users must join the same consultationId room.
==================================================
*/

const roomUsers = {};
const socketRoomMap = {};

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
    socket.emit("me", socket.id);

    socket.on("join-room", (consultationId) => {
      if (!consultationId) return;
      if (socketRoomMap[socket.id] === consultationId) return; // no duplicate join

      socket.join(consultationId);
      socketRoomMap[socket.id] = consultationId;

      if (!roomUsers[consultationId]) roomUsers[consultationId] = [];

      if (!roomUsers[consultationId].includes(socket.id)) {
        roomUsers[consultationId].push(socket.id);
      }

      const room = roomUsers[consultationId];
      console.log(
        `[Room ${consultationId}] ${socket.id} joined. Total: ${room.length}`,
      );

      if (room.length === 2) {
        const [firstUser, secondUser] = room;

        // First user: initiate the call
        io.to(firstUser).emit("other-user", {
          socketId: secondUser,
          shouldInitiate: true,
          usersInRoom: 2,
        });

        // Second user: wait for incoming-call
        io.to(secondUser).emit("existing-user", {
          socketId: firstUser,
          usersInRoom: 2,
        });

        console.log(
          `[Room ${consultationId}] ✅ Both users ready. ${firstUser} → calls → ${secondUser}`,
        );
      }

      if (room.length > 2) {
        socket.emit("room-full");
        console.warn(`[Room ${consultationId}] Full — ${socket.id} rejected`);
      }
    });

    socket.on("call-user", ({ userToCall, signalData, from }) => {
      console.log(`[Signal] call-user received:`, {
        userToCall,
        from,
        hasSignal: !!signalData,
      });
      if (!userToCall || !signalData || !from) {
        console.warn(`[Signal] Missing required fields:`, {
          userToCall,
          signalData: !!signalData,
          from,
        });
        return;
      }
      console.log(`[Signal] ✅ call-user: ${from} → ${userToCall}`);
      io.to(userToCall).emit("incoming-call", { signal: signalData, from });
      console.log(`[Signal] ✅ incoming-call emitted to ${userToCall}`);
    });

    socket.on("answer-call", ({ to, signal }) => {
      console.log(`[Signal] answer-call received:`, {
        to,
        hasSignal: !!signal,
        from: socket.id,
      });
      if (!to || !signal) {
        console.warn(`[Signal] Missing required fields in answer-call`);
        return;
      }
      console.log(`[Signal] ✅ answer-call: ${socket.id} → ${to}`);
      io.to(to).emit("call-accepted", signal);
      console.log(`[Signal] ✅ call-accepted emitted to ${to}`);
    });

    socket.on("end-call", () => {
      const consultationId = socketRoomMap[socket.id];
      if (consultationId) {
        socket.to(consultationId).emit("call-ended");
        console.log(`[Room ${consultationId}] end-call by ${socket.id}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const consultationId = socketRoomMap[socket.id];

      if (consultationId && roomUsers[consultationId]) {
        roomUsers[consultationId] = roomUsers[consultationId].filter(
          (id) => id !== socket.id,
        );
        socket.to(consultationId).emit("call-ended");
        console.log(
          `[Room ${consultationId}] ${socket.id} left. Remaining: ${roomUsers[consultationId].length}`,
        );

        if (roomUsers[consultationId].length === 0) {
          delete roomUsers[consultationId];
        }
      }
      delete socketRoomMap[socket.id];
    });
  });

  return io;
};

export default initializeSocket;
