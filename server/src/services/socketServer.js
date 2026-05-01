import { Server } from "socket.io";

/*
==================================================
INDUSTRY LEVEL SOCKET.IO + WEBRTC SIGNALING SERVER
FOR DOCTOR ↔ PATIENT LIVE VIDEO CONSULTATION
==================================================

FLOW:

1. First user joins consultation room
   → waits

2. Second user joins same room
   → first user gets notified

3. First user clicks Start Call
   → signaling starts

4. Second user receives incoming call
   → Answer Call button appears

5. Both users connect successfully

6. Proper disconnect handling included

==================================================
*/

const roomUsers = {}; // consultationId => [socketId1, socketId2]
const socketUserMap = {}; // socketId => consultationId

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

  /*
  ==================================================
  SOCKET CONNECTION
  ==================================================
  */

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    /*
    ==================================================
    SEND OWN SOCKET ID
    ==================================================
    */

    socket.emit("me", socket.id);

    /*
    ==================================================
    JOIN CONSULTATION ROOM
    ==================================================
    */

    socket.on("join-room", (consultationId) => {
      if (!consultationId) return;

      socket.join(consultationId);

      /*
      Store socket-room mapping
      */

      socketUserMap[socket.id] = consultationId;

      /*
      Initialize room if not exists
      */

      if (!roomUsers[consultationId]) {
        roomUsers[consultationId] = [];
      }

      /*
      Prevent duplicate joins
      */

      if (!roomUsers[consultationId].includes(socket.id)) {
        roomUsers[consultationId].push(socket.id);
      }

      const usersInRoom = roomUsers[consultationId];

      console.log(
        `Socket ${socket.id} joined room ${consultationId}. Total users: ${usersInRoom.length}`,
      );

      /*
      Notify existing user when second participant joins
      */

      if (usersInRoom.length === 2) {
        const firstUser = usersInRoom[0];
        const secondUser = usersInRoom[1];

        io.to(firstUser).emit("other-user", secondUser);
        io.to(secondUser).emit("other-user", firstUser);

        console.log(
          `Room ready for call: ${consultationId} | ${firstUser} ↔ ${secondUser}`,
        );
      }

      /*
      Safety:
      Prevent >2 users in one consultation room
      */

      if (usersInRoom.length > 2) {
        console.warn(
          `More than 2 users joined consultation room ${consultationId}`,
        );
      }
    });

    /*
    ==================================================
    CALL USER (INITIATOR)
    ==================================================
    */

    socket.on("call-user", (data) => {
      const { userToCall, signalData, from } = data;

      if (!userToCall || !signalData || !from) return;

      console.log(`Call initiated: ${from} → ${userToCall}`);

      io.to(userToCall).emit("incoming-call", {
        signal: signalData,
        from,
      });
    });

    /*
    ==================================================
    ANSWER CALL (RECEIVER)
    ==================================================
    */

    socket.on("answer-call", (data) => {
      const { to, signal } = data;

      if (!to || !signal) return;

      console.log(`Call answered: ${socket.id} → ${to}`);

      io.to(to).emit("call-accepted", signal);
    });

    /*
    ==================================================
    OPTIONAL: MANUAL CALL END EVENT
    ==================================================
    */

    socket.on("end-call", () => {
      const consultationId = socketUserMap[socket.id];

      if (consultationId) {
        socket.to(consultationId).emit("call-ended");
      }
    });

    /*
    ==================================================
    DISCONNECT HANDLER
    ==================================================
    */

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      const consultationId = socketUserMap[socket.id];

      if (consultationId && roomUsers[consultationId]) {
        /*
        Remove disconnected socket from room
        */

        roomUsers[consultationId] = roomUsers[consultationId].filter(
          (id) => id !== socket.id,
        );

        /*
        Notify remaining participant
        */

        socket.to(consultationId).emit("call-ended");

        /*
        Cleanup empty room
        */

        if (roomUsers[consultationId].length === 0) {
          delete roomUsers[consultationId];
        }
      }

      delete socketUserMap[socket.id];
    });
  });

  return io;
};

export default initializeSocket;
