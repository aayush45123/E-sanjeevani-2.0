import { Server } from "socket.io";

/*
==================================================
FINAL UPDATED ROOM-BASED SOCKET.IO SERVER
E-Sanjeevani WebRTC Video Consultation
FULLY MATCHED WITH NATIVE WEBRTC FRONTEND
==================================================

FLOW:

User 1 joins room
→ waits

User 2 joins same room
→ User 1 gets "other-user" and creates OFFER

User 2 gets "incoming-call"
→ creates ANSWER automatically

User 1 gets "call-accepted"

ICE candidates exchanged

Remote participant video appears successfully

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
    ==================================================
    SEND OWN SOCKET ID
    ==================================================
    */

    socket.emit("me", socket.id);

    /*
    ==================================================
    JOIN ROOM
    ==================================================
    */

    socket.on("join-room", (data) => {
      const consultationId = data.consultationId || data;
      const userRole = data.userRole || "unknown";
      const userName = data.userName || "User";

      if (!consultationId) return;

      /*
      Prevent duplicate joins
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
        `[Room ${consultationId}] ${socket.id} joined (${userRole}) | Users: ${room.length}`,
      );

      // SEND CONFIRMATION TO THIS USER THAT THEY'VE JOINED
      socket.emit("room-join-confirmed", {
        consultationId,
        usersInRoom: room.length,
      });

      // NOTIFY OTHER USER THAT SOMEONE JOINED
      socket.to(consultationId).emit("user-joined", {
        userRole: userRole,
        userName: userName,
        usersInRoom: room.length,
        joinedAt: new Date(),
      });

      /*
      EXACTLY 2 USERS
      */

      if (room.length === 2) {
        const [firstUser, secondUser] = room;

        /*
        ONLY FIRST USER INITIATES
        */

        io.to(firstUser).emit("other-user", {
          shouldInitiate: true,
          usersInRoom: 2,
        });

        /*
        SECOND USER JUST WAITS
        */

        io.to(secondUser).emit("existing-user", {
          usersInRoom: 2,
        });

        console.log(
          `[Room ${consultationId}] READY → ${firstUser} initiates → ${secondUser}`,
        );
      }

      /*
      Prevent more than 2 users
      */

      if (room.length > 2) {
        socket.emit("room-full");

        console.warn(`[Room ${consultationId}] Full → rejecting ${socket.id}`);
      }
    });

    /*
    ==================================================
    OFFER → ROOM BASED
    ==================================================
    */

    socket.on("call-user", ({ consultationId, signalData, from }) => {
      if (!consultationId || !signalData || !from) {
        console.warn("[Signal] Invalid OFFER payload");
        return;
      }

      console.log(`[Signal] OFFER → ${from} → room ${consultationId}`);

      /*
        Send to everyone else in room
        */

      socket.to(consultationId).emit("incoming-call", {
        signal: signalData,
        from,
      });
    });

    /*
    ==================================================
    ANSWER → ROOM BASED
    ==================================================
    */

    socket.on("answer-call", ({ consultationId, signal }) => {
      if (!consultationId || !signal) {
        console.warn("[Signal] Invalid ANSWER payload");
        return;
      }

      console.log(`[Signal] ANSWER → room ${consultationId}`);

      /*
        Send answer back to initiator
        */

      socket.to(consultationId).emit("call-accepted", signal);
    });

    /*
    ==================================================
    ICE CANDIDATE EXCHANGE
    ==================================================
    */

    socket.on("ice-candidate", ({ consultationId, candidate }) => {
      if (!consultationId || !candidate) return;

      socket.to(consultationId).emit("ice-candidate", {
        candidate,
      });
    });

    /*
    ==================================================
    END CALL
    ==================================================
    */

    socket.on("end-call", () => {
      const consultationId = socketRoomMap[socket.id];

      if (consultationId) {
        console.log(`[Room ${consultationId}] Call ended by ${socket.id}`);

        // Send to everyone in the room (including the sender so they see confirmation)
        io.to(consultationId).emit("call-ended", {
          message: "Consultation ended by the other participant",
          endedAt: new Date(),
        });

        console.log(
          `🔴 [Room ${consultationId}] call-ended event broadcasted to all participants`,
        );
      }
    });

    /*
    ==================================================
    DISCONNECT
    ==================================================
    */

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      const consultationId = socketRoomMap[socket.id];

      if (consultationId && roomUsers[consultationId]) {
        roomUsers[consultationId] = roomUsers[consultationId].filter(
          (id) => id !== socket.id,
        );

        // Notify other participants that the connection was lost
        socket.to(consultationId).emit("call-ended", {
          message: "The other participant has disconnected",
          endedAt: new Date(),
        });

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
