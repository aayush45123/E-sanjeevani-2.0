# Plan 06-3: WebRTC WebSocket Handshake Authentication

> **Phase**: 06 — Production Hardening, Security & Infrastructure  
> **Wave**: 3 of 4  
> **Requirements**: REQ-SEC-WS-01, REQ-SEC-WS-02  
> **Files Modified**:  
> - `server/src/socket/socketServer.js`  
> - `client/src/pages/VideoCall/VideoCall.jsx`  

---

## Task 3.1: Add JWT Authentication Middleware to Socket.IO Handshake
- **File**: `server/src/socket/socketServer.js`
- **Action**:
  - Implement `io.use(async (socket, next) => ...)`:
    - Extract token from `socket.handshake.auth?.token` or cookie string.
    - Verify token using `jwt.verify(token, process.env.JWT_SECRET)`.
    - If valid, assign `socket.user = decoded; next();`.
    - If invalid or missing, call `next(new Error("Authentication error: Unauthorized connection"))`.
- **Verification**: Socket connection attempt without token is dropped with `Authentication error`.

## Task 3.2: Enforce Consultation Room Participant Validation on `join-room`
- **File**: `server/src/socket/socketServer.js`
- **Action**:
  - In `socket.on("join-room", async (data) => ...)`:
    - Extract `consultationId`.
    - Query consultation from PostgreSQL using `ConsultationRepository.findById(consultationId)`.
    - Verify that `socket.user.id === consultation.patientId` OR `socket.user.id === consultation.doctorId` OR `socket.user.role === "admin"`.
    - If unauthorized, emit `room-error` with `"Access denied: You are not a participant in this consultation"` and do not join room.
- **Verification**: User not assigned to Consultation X is prevented from joining the room.

## Task 3.3: Update Client Socket Initialization with Auth Token
- **File**: `client/src/pages/VideoCall/VideoCall.jsx`
- **Action**:
  - Pass `{ auth: { token: getAccessToken() } }` when creating the Socket.IO client instance.
  - Listen for `room-error` or `connect_error` events and display a clinical toast notification if room admission is rejected.
- **Verification**: Legitimate doctor and patient join video call room seamlessly with active P2P video/audio.

