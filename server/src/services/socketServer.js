import { Server } from "socket.io";

/*
==================================================
FINAL PRODUCTION SOCKET.IO SIGNALING SERVER
E-Sanjeevani WebRTC Video Consultation
==================================================

FLOW:

User 1 joins room
→ waits

User 2 joins same room
→ User 1 receives "other-user"
→ ONLY User 1 initiates call

User 2 receives "incoming-call"
→ answers automatically

User 1 receives "call-accepted"

Both streams connect successfully

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

    /*
    =========================================
    SEND OWN SOCKET ID
    =========================================
    */

    socket.emit("me", socket.id);

    /*
    =========================================
    JOIN ROOM
    =========================================
    */

    socket.on("join-room", (consultationId) => {
      if (!consultationId) return;

      /*
      Prevent duplicate join
      */

      if (socketRoomMap[socket.id] === consultationId) {
        return;
      }

      socket.join(consultationId);
      socketRoomMap[socket.id] = consultationId;

      if (!roomUsers[consultationId]) {
        roomUsers[consultationId] = [];
      }

      if (!roomUsers[consultationId].includes(socket.id)) {
        roomUsers[consultationId].push(socket.id);
      }

      const room = roomUsers[consultationId];

      console.log(
        `[Room ${consultationId}] ${socket.id} joined | Users: ${room.length}`,
      );

      /*
      EXACTLY 2 USERS REQUIRED
      */

      if (room.length === 2) {
        const [firstUser, secondUser] = room;

        /*
        ONLY FIRST USER INITIATES
        */

        io.to(firstUser).emit("other-user", {
          socketId: secondUser,
          shouldInitiate: true,
          usersInRoom: 2,
        });

        /*
        SECOND USER ONLY WAITS
        */

        io.to(secondUser).emit("existing-user", {
          socketId: firstUser,
          usersInRoom: 2,
        });

        console.log(
          `[Room ${consultationId}] READY → ${firstUser} initiates → ${secondUser}`,
        );
      }

      /*
      Prevent room overflow
      */

      if (room.length > 2) {
        socket.emit("room-full");

        console.warn(`[Room ${consultationId}] Full → rejecting ${socket.id}`);
      }
    });

    /*
    =========================================
    CALL USER (OFFER)
    =========================================
    */

    socket.on("call-user", ({ userToCall, signalData, from }) => {
      if (!userToCall || !signalData || !from) {
        console.warn("[Signal] Invalid call-user payload");
        return;
      }

      console.log(`[Signal] OFFER → ${from} calling ${userToCall}`);

      io.to(userToCall).emit("incoming-call", {
        signal: signalData,
        from,
      });
    });

    /*
    =========================================
    ANSWER CALL (ANSWER)
    =========================================
    */

    socket.on("answer-call", ({ to, signal }) => {
      if (!to || !signal) {
        console.warn("[Signal] Invalid answer-call payload");
        return;
      }

      console.log(`[Signal] ANSWER → ${socket.id} answering ${to}`);

      io.to(to).emit("call-accepted", signal);
    });

    /*
    =========================================
    END CALL
    =========================================
    */

    socket.on("end-call", () => {
      const consultationId = socketRoomMap[socket.id];

      if (consultationId) {
        socket.to(consultationId).emit("call-ended");

        console.log(`[Room ${consultationId}] Call ended by ${socket.id}`);
      }
    });

    /*
    =========================================
    DISCONNECT
    =========================================
    */

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      const consultationId = socketRoomMap[socket.id];

      if (consultationId && roomUsers[consultationId]) {
        roomUsers[consultationId] = roomUsers[consultationId].filter(
          (id) => id !== socket.id,
        );

        socket.to(consultationId).emit("call-ended");

        console.log(
          `[Room ${consultationId}] ${socket.id} left | Remaining: ${roomUsers[consultationId].length}`,
        );

        /*
        Cleanup empty room
        */

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
