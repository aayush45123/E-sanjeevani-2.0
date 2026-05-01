import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Peer from "simple-peer";
import styles from "./VideoCall.module.css";
import { consultationApi } from "../../utils/api";

const SOCKET_URL = "http://localhost:5000";

export default function VideoCall() {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [callStatus, setCallStatus] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [debugInfo, setDebugInfo] = useState({
    mySocketId: "",
    usersInRoom: 0,
  });

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const mySocketId = useRef(null);
  const initiateCallRef = useRef(null);
  const answerCallRef = useRef(null);

  const initiateCall = useCallback((otherSocketId) => {
    console.log("[Peer] ─────────────────────────────────");
    console.log("[Peer] Starting initiateCall");
    console.log("[Peer] otherSocketId:", otherSocketId);
    console.log("[Peer] connectionRef.current:", !!connectionRef.current);
    console.log("[Peer] streamRef.current:", !!streamRef.current);
    console.log("[Peer] socketRef.current:", !!socketRef.current);
    console.log("[Peer] mySocketId.current:", mySocketId.current);
    console.log("[Peer] ─────────────────────────────────");

    if (connectionRef.current) {
      console.warn("[Peer] ⚠️ Connection already exists, aborting");
      return;
    }
    if (!streamRef.current) {
      console.error("[Peer] ❌ No stream available");
      return;
    }
    if (!socketRef.current) {
      console.error("[Peer] ❌ No socket available");
      return;
    }

    console.log("[Peer] Creating peer with initiator=true");

    try {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: streamRef.current,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
      });
      console.log("[Peer] ✅ Peer object created successfully");

      peer.on("signal", (signalData) => {
        console.log("[Peer] 🔔 SIGNAL EVENT FIRED!");
        console.log("[Peer] Signal type:", signalData?.type);
        console.log(
          "[Peer] Signal data size:",
          JSON.stringify(signalData).length,
        );
        console.log("[Peer] Target socket ID:", otherSocketId);
        console.log("[Peer] My socket ID:", mySocketId.current);

        if (!socketRef.current) {
          console.error("[Peer] ❌ Socket disconnected during signal!");
          return;
        }

        console.log("[Peer] Emitting call-user event...");
        socketRef.current.emit("call-user", {
          userToCall: otherSocketId,
          signalData,
          from: mySocketId.current,
        });
        console.log("[Peer] ✅ call-user emitted successfully");
      });

      peer.on("stream", (remoteStream) => {
        console.log("[Peer] ✅ Remote stream received");
        if (userVideo.current) userVideo.current.srcObject = remoteStream;
        setCallStatus("connected");
      });

      peer.on("error", (err) => {
        console.error("[Peer] ❌ Peer error:", err);
        setConnectionError(`Peer error: ${err.message || err}`);
        connectionRef.current = null;
      });

      peer.on("close", () => {
        console.log("[Peer] ℹ️ Peer connection closed");
        setCallStatus("ended");
        connectionRef.current = null;
      });

      connectionRef.current = peer;
      setCallStatus("connecting");
      console.log("[Peer] ✅ initiateCall setup complete");
    } catch (err) {
      console.error("[Peer] ❌ Failed to create peer:", err);
      setConnectionError(`Failed to create peer: ${err.message}`);
    }
  }, []);

  const answerCall = useCallback((callerSocketId, callerSignal) => {
    if (connectionRef.current) return;
    if (!streamRef.current) {
      console.error("[Peer] No stream");
      return;
    }

    console.log("[Peer] Answering from", callerSocketId);
    setCallStatus("connecting");

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: streamRef.current,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      },
    });

    peer.on("signal", (data) => {
      console.log("[Peer] Answer signal data generated:", {
        type: data?.type,
        dataLength: JSON.stringify(data).length,
        callerSocketId,
      });
      console.log("[Peer] Emitting answer-call to socket...");
      socketRef.current?.emit("answer-call", {
        signal: data,
        to: callerSocketId,
      });
      console.log("[Peer] ✅ answer-call emitted");
    });

    peer.on("stream", (remoteStream) => {
      console.log("[Peer] ✅ Remote stream received");
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
      setCallStatus("connected");
    });

    peer.on("error", (err) => {
      console.error("[Peer] Error:", err);
      setConnectionError("Connection failed. Refresh and try again.");
      connectionRef.current = null;
    });

    peer.on("close", () => {
      setCallStatus("ended");
      connectionRef.current = null;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  }, []);

  useEffect(() => {
    initiateCallRef.current = initiateCall;
    answerCallRef.current = answerCall;
  }, [initiateCall, answerCall]);

  useEffect(() => {
    let mounted = true;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[VideoCall] Room:", consultationId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (!consultationId) {
      setConnectionError(
        "No consultation ID in URL. Please go back and click Join again.",
      );
      return;
    }

    const setup = async () => {
      let localStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        if (mounted)
          setConnectionError(
            "Camera/mic access denied. Please allow and refresh.",
          );
        return;
      }

      if (!mounted) {
        localStream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = localStream;
      if (myVideo.current) myVideo.current.srcObject = localStream;

      const socket = io(SOCKET_URL, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log(
          "[Socket] Connected:",
          socket.id,
          "→ joining room:",
          consultationId,
        );
        mySocketId.current = socket.id;
        setDebugInfo((p) => ({ ...p, mySocketId: socket.id }));
        socket.emit("join-room", consultationId);
        setCallStatus("waiting");
      });

      socket.on("me", (id) => {
        mySocketId.current = id;
      });

      // I was first; other user just arrived — I initiate
      socket.on("other-user", ({ socketId, shouldInitiate, usersInRoom }) => {
        console.log("┌─────────────────────────────────────────");
        console.log("│ [Socket] other-user event received");
        console.log("│ socketId (remote):", socketId);
        console.log("│ shouldInitiate:", shouldInitiate);
        console.log("│ usersInRoom:", usersInRoom);
        console.log("│ mySocketId (current):", mySocketId.current);
        console.log("└─────────────────────────────────────────");

        setDebugInfo((p) => ({ ...p, usersInRoom: usersInRoom || 2 }));

        if (shouldInitiate) {
          console.log(
            "[Socket] ✅ I should initiate. Scheduling initiateCall in 800ms...",
          );
          setTimeout(() => {
            console.log(
              "[Socket] ⏱️ 800ms elapsed. Calling initiateCall now...",
            );
            if (initiateCallRef.current) {
              initiateCallRef.current(socketId);
            } else {
              console.error("[Socket] ❌ initiateCallRef.current is null!");
            }
          }, 800);
        } else {
          console.log(
            "[Socket] ℹ️ I should NOT initiate, waiting for incoming-call",
          );
        }
      });

      // I joined second — wait for incoming-call
      socket.on("existing-user", ({ socketId, usersInRoom }) => {
        console.log(
          "[Socket] existing-user in room:",
          socketId,
          "| room size:",
          usersInRoom,
        );
        setDebugInfo((p) => ({ ...p, usersInRoom: usersInRoom || 2 }));
      });

      socket.on("incoming-call", ({ signal, from }) => {
        console.log("[Socket] incoming-call from:", from);
        answerCallRef.current?.(from, signal);
      });

      socket.on("call-accepted", (signal) => {
        console.log("[Socket] call-accepted");
        connectionRef.current?.signal(signal);
      });

      socket.on("room-full", () =>
        setConnectionError("This consultation room is full."),
      );

      socket.on("call-ended", () => {
        console.log("[Socket] call-ended by peer");
        setCallStatus("ended");
        connectionRef.current?.destroy();
        connectionRef.current = null;
        if (userVideo.current) userVideo.current.srcObject = null;
      });

      try {
        await consultationApi.updateConsultationStatus(consultationId, {
          status: "ongoing",
        });
      } catch (_) {}
    };

    setup();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      connectionRef.current?.destroy();
      connectionRef.current = null;
      if (socketRef.current) {
        socketRef.current.emit("end-call");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [consultationId]);

  const leaveCall = async () => {
    connectionRef.current?.destroy();
    connectionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    socketRef.current?.emit("end-call");
    socketRef.current?.disconnect();
    try {
      await consultationApi.updateConsultationStatus(consultationId, {
        status: "completed",
      });
    } catch (_) {}
    navigate("/dashboard");
  };

  const toggleMute = () => {
    const t = streamRef.current?.getAudioTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setIsMuted(!t.enabled);
    }
  };

  const toggleVideo = () => {
    const t = streamRef.current?.getVideoTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setIsVideoOff(!t.enabled);
    }
  };

  const STATUS_LABEL = {
    idle: "Setting up...",
    waiting: "Waiting for other participant...",
    connecting: "Connecting...",
    connected: "Connected",
    ended: "Call ended",
  };

  const STATUS_COLOR = {
    idle: "#94a3b8",
    waiting: "#f59e0b",
    connecting: "#3b82f6",
    connected: "#10b981",
    ended: "#ef4444",
  };

  return (
    <div className={styles.page}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className={styles.brandName}>E-Sanjeevani</span>
        </div>
        <h1 className={styles.pageTitle}>Live Consultation</h1>
        <div
          className={styles.statusPill}
          style={{ "--sc": STATUS_COLOR[callStatus] }}
        >
          <span
            className={styles.statusDot}
            style={{ background: STATUS_COLOR[callStatus] }}
          />
          <span>{STATUS_LABEL[callStatus]}</span>
        </div>
      </header>

      {/* ── DEBUG BANNER — remove after testing ── */}
      <div className={styles.debugBanner}>
        <span>
          🔑 Room: <code>{consultationId}</code>
        </span>
        {debugInfo.mySocketId && (
          <span>
            · Socket: <code>{debugInfo.mySocketId.slice(0, 10)}…</code>
          </span>
        )}
        {debugInfo.usersInRoom > 0 && (
          <span>
            · <strong>{debugInfo.usersInRoom}/2</strong> users in room
          </span>
        )}
      </div>

      {connectionError && (
        <div className={styles.errorBanner}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {connectionError}
        </div>
      )}

      {/* Video Grid */}
      <div className={styles.videoGrid}>
        <div className={styles.videoCard}>
          <span className={styles.videoLabel}>You</span>
          <video
            playsInline
            muted
            ref={myVideo}
            autoPlay
            className={styles.video}
          />
          {isVideoOff && (
            <div className={styles.overlay}>
              <div className={styles.avatarRing}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <p>Camera off</p>
            </div>
          )}
        </div>

        <div className={styles.videoCard}>
          <span className={styles.videoLabel}>Participant</span>
          <video
            playsInline
            ref={userVideo}
            autoPlay
            className={styles.video}
          />
          {(callStatus === "waiting" || callStatus === "connecting") && (
            <div className={styles.overlay}>
              <div className={styles.spinner} />
              <p>
                {callStatus === "waiting"
                  ? "Waiting for participant..."
                  : "Connecting..."}
              </p>
            </div>
          )}
          {callStatus === "ended" && (
            <div className={styles.overlay}>
              <div className={styles.endedIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <p>Participant disconnected</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={`${styles.ctrlBtn} ${isMuted ? styles.ctrlBtnOn : ""}`}
          onClick={toggleMute}
        >
          {isMuted ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
          <span>{isMuted ? "Unmute" : "Mute"}</span>
        </button>

        <button
          className={`${styles.ctrlBtn} ${isVideoOff ? styles.ctrlBtnOn : ""}`}
          onClick={toggleVideo}
        >
          {isVideoOff ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          )}
          <span>{isVideoOff ? "Start Video" : "Stop Video"}</span>
        </button>

        <button className={styles.endBtn} onClick={leaveCall}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.43 9.68 19.79 19.79 0 0 1 1.36 1.05 2 2 0 0 1 3.32 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.3 10.9a16 16 0 0 0 3.38 2.41z" />
            <line x1="23" y1="1" x2="1" y2="23" />
          </svg>
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
}
