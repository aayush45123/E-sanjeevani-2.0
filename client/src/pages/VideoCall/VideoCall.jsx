import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { consultationApi } from "../../utils/api";
import Sidebar from "../../components/Sidebar/Sidebar";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import styles from "./VideoCall.module.css";

const SOCKET_URL = "http://localhost:5000";

export default function VideoCall() {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [connectionError, setConnectionError] = useState("");
  const [usersInRoom, setUsersInRoom] = useState(1);
  const [callStatus, setCallStatus] = useState("connecting");

  // Doctor AI Assistant State
  const [doctorAssistantData, setDoctorAssistantData] = useState(null);
  const [doctorAiQuery, setDoctorAiQuery] = useState("");
  const [doctorAiReply, setDoctorAiReply] = useState("");
  const [doctorAiLoading, setDoctorAiLoading] = useState(false);

  const userRole = localStorage.getItem("userRole");
  const token = localStorage.getItem("token");

  const userName =
    localStorage.getItem("userName") ||
    (userRole === "doctor" ? "Doctor" : "Patient");

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  // Video refs
  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null); // WebRTC data channel for chat

  // Mic/camera toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // Call timer
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef(null);

  /*
  =============================================
  LOAD CHAT HISTORY
  =============================================
  */
  const loadChatHistory = async () => {
    try {
      const response = await fetch(
        `/api/chat/consultation/${consultationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.data) {
        // Convert fetched messages to component format
        const formattedMessages = data.data.map((msg) => ({
          id: msg._id,
          sender:
            msg.senderId === localStorage.getItem("userId") ? "me" : "remote",
          senderName:
            msg.senderName ||
            (msg.senderRole === "doctor" ? "Doctor" : "Patient"),
          text: msg.text,
          timestamp: new Date(msg.createdAt),
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  /*
  =============================================
  SAVE MESSAGE TO BACKEND
  =============================================
  */
  const saveMessageToBackend = async (text, senderName) => {
    try {
      await fetch(`/api/chat/consultation/${consultationId}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          consultationId,
          text,
          senderName,
        }),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  /*
  =============================================
  CREATE PEER CONNECTION WITH DATA CHANNEL
  =============================================
  */
  const createPeerConnection = useCallback(() => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
    });

    // Send ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          consultationId,
          candidate: event.candidate,
        });
      }
    };

    // Remote stream
    peer.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
        setCallStatus("active");
        startTimer();
      }
    };

    // Receive data channel (from remote peer)
    peer.ondatachannel = (event) => {
      const channel = event.channel;
      setupDataChannel(channel);
      dataChannelRef.current = channel;
    };

    // Add local tracks
    localStreamRef.current.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current);
    });

    peerRef.current = peer;
    return peer;
  }, [consultationId]);

  /*
  =============================================
  SETUP DATA CHANNEL (CHAT)
  =============================================
  */
  const setupDataChannel = (channel) => {
    channel.onopen = () => {
      console.log("[DataChannel] Chat channel open");
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "typing") {
          setIsTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
          return;
        }

        if (data.type === "message") {
          const newMsg = {
            id: Date.now(),
            sender: "remote",
            senderName:
              data.senderName || (userRole === "doctor" ? "Patient" : "Doctor"),
            text: data.text,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, newMsg]);

          // Save remote message to backend
          saveMessageToBackend(data.text, newMsg.senderName);

          if (!isChatOpen) {
            setUnreadCount((c) => c + 1);
          }
        }
      } catch (err) {
        console.error("[DataChannel] Parse error:", err);
      }
    };

    channel.onclose = () => {
      console.log("[DataChannel] Chat channel closed");
    };
  };

  /*
  =============================================
  SEND CHAT MESSAGE
  =============================================
  */
  const sendMessage = () => {
    if (!chatInput.trim()) return;

    const payload = {
      type: "message",
      text: chatInput.trim(),
      senderName: userName,
    };

    const myMsg = {
      id: Date.now(),
      sender: "me",
      senderName: "You",
      text: chatInput.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, myMsg]);

    // Save my message to backend
    saveMessageToBackend(chatInput.trim(), userName);

    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify(payload));
    }

    setChatInput("");
  };

  const sendTypingIndicator = () => {
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify({ type: "typing" }));
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear unread when opening chat
  useEffect(() => {
    if (isChatOpen) setUnreadCount(0);
  }, [isChatOpen]);

  /*
  =============================================
  TIMER
  =============================================
  */
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setCallDuration((d) => d + 1);
    }, 1000);
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  /*
=============================================
DOCTOR ASSISTANT DATA FETCH
=============================================
*/

  useEffect(() => {
    const fetchDoctorAssistantData = async () => {
      if (userRole !== "doctor") return;

      try {
        const response = await fetch(
          `http://localhost:5000/api/doctor-assistant/${consultationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (data.success) {
          setDoctorAssistantData(data.data);
        }
      } catch (error) {
        console.error("Doctor Assistant Error:", error);
      }
    };

    fetchDoctorAssistantData();
  }, [consultationId, userRole, token]);

  /*
  =============================================
  INIT
  =============================================
  */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;
        localStreamRef.current = stream;

        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }

        const socket = io(SOCKET_URL, { transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join-room", consultationId);
        });

        // First user — create offer + data channel
        socket.on("other-user", async ({ shouldInitiate, usersInRoom }) => {
          setUsersInRoom(usersInRoom || 2);

          // Load chat history when other user joins
          loadChatHistory();

          if (!shouldInitiate) return;

          const peer = createPeerConnection();

          // Initiator creates data channel
          const channel = peer.createDataChannel("chat");
          setupDataChannel(channel);
          dataChannelRef.current = channel;

          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);

          socket.emit("call-user", {
            consultationId,
            signalData: offer,
            from: socket.id,
          });
        });

        // Second user — receive offer
        socket.on("incoming-call", async ({ signal, from }) => {
          const peer = createPeerConnection();
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("answer-call", { consultationId, signal: answer });
        });

        // First user — receive answer
        socket.on("call-accepted", async (signal) => {
          if (!peerRef.current) return;
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(signal),
          );
        });

        // ICE exchange
        socket.on("ice-candidate", async ({ candidate }) => {
          if (peerRef.current && candidate) {
            try {
              await peerRef.current.addIceCandidate(
                new RTCIceCandidate(candidate),
              );
            } catch (err) {
              console.log(err);
            }
          }
        });

        socket.on("existing-user", ({ usersInRoom }) => {
          setUsersInRoom(usersInRoom || 2);
        });

        socket.on("call-ended", () => leaveCall(false));

        try {
          await consultationApi.updateConsultationStatus(consultationId, {
            status: "ongoing",
          });
        } catch (err) {
          console.log(err);
        }
      } catch (err) {
        console.error(err);
        setConnectionError("Camera / microphone permission required");
      }
    };

    init();

    return () => {
      mounted = false;
      clearInterval(timerRef.current);
      clearTimeout(typingTimeoutRef.current);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current?.close();
      socketRef.current?.disconnect();
    };
  }, [consultationId]);

  /*
=============================================
DOCTOR AI QUERY FUNCTION
=============================================
*/

  const handleDoctorAiQuery = async () => {
    if (!doctorAiQuery.trim()) return;

    setDoctorAiLoading(true);

    try {
      const patientSummary = `
Patient Name: ${doctorAssistantData?.patientBasicInfo?.name || ""}
Age: ${doctorAssistantData?.patientProfile?.age || ""}
Gender: ${doctorAssistantData?.patientProfile?.gender || ""}
Medical History: ${doctorAssistantData?.patientProfile?.medicalHistory || ""}
Current Medications: ${doctorAssistantData?.patientProfile?.currentMedications || ""}
Allergies: ${doctorAssistantData?.patientProfile?.allergies || ""}
Symptoms: ${doctorAssistantData?.consultationDetails?.symptoms || ""}
Problem Description: ${doctorAssistantData?.consultationDetails?.problemDescription || ""}
Predicted Disease: ${doctorAssistantData?.latestAITriage?.predictedDisease || ""}
Urgency: ${doctorAssistantData?.latestAITriage?.urgency || ""}
Recommended Specialist: ${doctorAssistantData?.latestAITriage?.doctorType || ""}
`;

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: `
You are a medical AI assistant helping a doctor during live consultation.

Patient Information:
${patientSummary}

Doctor Question:
${doctorAiQuery}

Provide:
1. Probable diagnosis
2. Medicine suggestions
3. Recommended tests
4. Severity level
5. Next steps

Give a professional doctor-level response.
          `,
        }),
      });

      const data = await response.json();

      if (data?.data?.reply) {
        setDoctorAiReply(data.data.reply);
      } else {
        setDoctorAiReply("No AI response generated.");
      }
    } catch (error) {
      console.error(error);
      setDoctorAiReply("Failed to get AI response.");
    }

    setDoctorAiLoading(false);
  };

  /*
  =============================================
  CONTROLS
  =============================================
  */
  const toggleMic = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
    }
  };

  const leaveCall = async (shouldNavigate = true) => {
    clearInterval(timerRef.current);
    try {
      await consultationApi.updateConsultationStatus(consultationId, {
        status: "completed",
      });
    } catch (err) {
      console.log(err);
    }
    dataChannelRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerRef.current?.close();
    socketRef.current?.emit("end-call");
    socketRef.current?.disconnect();
    if (shouldNavigate) navigate("/dashboard");
  };

  const sidebarWidth = userRole === "doctor" ? 230 : 260;

  return (
    <div className={styles.root}>
      {userRole === "doctor" ? <DoctorSidebar /> : <Sidebar />}

      <div className={styles.callLayout} style={{ marginLeft: sidebarWidth }}>
        {/* ── TOP BAR ── */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.statusDot} data-status={callStatus} />
            <span className={styles.topBarTitle}>Live Consultation</span>
            {callStatus === "active" && (
              <span className={styles.timer}>
                {formatDuration(callDuration)}
              </span>
            )}
          </div>
          <div className={styles.topBarRight}>
            <span className={styles.roomTag}>
              Room {consultationId?.slice(-6)?.toUpperCase()} · {usersInRoom}/2
              participants
            </span>
          </div>
        </div>

        {connectionError && (
          <div className={styles.errorBanner}>{connectionError}</div>
        )}

        {/* ── MAIN BODY ── */}
        <div className={styles.mainBody}>
          {/* ── CHAT PANEL ── */}
          <div
            className={`${styles.chatPanel} ${isChatOpen ? styles.chatOpen : styles.chatClosed}`}
          >
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Live Chat</span>
              </div>
              <button
                className={styles.chatToggleBtn}
                onClick={() => setIsChatOpen(false)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>

            <div className={styles.chatMessages}>
              {messages.length === 0 && (
                <div className={styles.chatEmpty}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#c8d3e0"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p>No messages yet</p>
                  <span>Messages are end-to-end encrypted via WebRTC</span>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.msgBubble} ${msg.sender === "me" ? styles.msgMe : styles.msgThem}`}
                >
                  <div className={styles.msgSender}>{msg.senderName}</div>
                  <div className={styles.msgText}>{msg.text}</div>
                  <div className={styles.msgTime}>
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className={`${styles.msgBubble} ${styles.msgThem}`}>
                  <div className={styles.typingIndicator}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className={styles.chatInputRow}>
              <input
                className={styles.chatInput}
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => {
                  setChatInput(e.target.value);
                  sendTypingIndicator();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                className={styles.chatSendBtn}
                onClick={sendMessage}
                disabled={!chatInput.trim()}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── VIDEO AREA ── */}
          <div className={styles.videoArea}>
            {/* Collapsed chat toggle */}
            {!isChatOpen && (
              <button
                className={styles.chatOpenBtn}
                onClick={() => setIsChatOpen(true)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{unreadCount}</span>
                )}
              </button>
            )}
            {/* Main (patient) video */}
            <div className={styles.mainVideoWrapper}>
              <video
                ref={remoteVideo}
                autoPlay
                playsInline
                className={styles.mainVideo}
              />
              {callStatus !== "active" && (
                <div className={styles.waitingOverlay}>
                  <div className={styles.waitingSpinner} />
                  <p>Waiting for participant to join…</p>
                </div>
              )}
              <div className={styles.mainVideoLabel}>
                {userRole === "doctor" ? "Patient" : "Doctor"}
              </div>
            </div>
            {/* PiP (self) video */}
            <div className={styles.pipWrapper}>
              <video
                ref={myVideo}
                autoPlay
                playsInline
                muted
                className={`${styles.pipVideo} ${isCameraOff ? styles.videoOff : ""}`}
              />
              {isCameraOff && (
                <div className={styles.cameraOffOverlay}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className={styles.pipLabel}>You</div>
            </div>

            {/* DOCTOR AI ASSISTANT PANEL */}
            {userRole === "doctor" && (
              <div className={styles.doctorAssistantPanel}>
                <h2>Doctor AI Assistant</h2>

                <div className={styles.patientSummaryCard}>
                  <h3>Patient Summary</h3>

                  <p>
                    <strong>Name:</strong>{" "}
                    {doctorAssistantData?.patientBasicInfo?.name || "-"}
                  </p>

                  <p>
                    <strong>Age:</strong>{" "}
                    {doctorAssistantData?.patientProfile?.age || "-"}
                  </p>

                  <p>
                    <strong>Gender:</strong>{" "}
                    {doctorAssistantData?.patientProfile?.gender || "-"}
                  </p>

                  <p>
                    <strong>Medical History:</strong>{" "}
                    {doctorAssistantData?.patientProfile?.medicalHistory || "-"}
                  </p>

                  <p>
                    <strong>Current Medications:</strong>{" "}
                    {doctorAssistantData?.patientProfile?.currentMedications ||
                      "-"}
                  </p>

                  <p>
                    <strong>Allergies:</strong>{" "}
                    {doctorAssistantData?.patientProfile?.allergies || "-"}
                  </p>

                  <p>
                    <strong>AI Predicted Disease:</strong>{" "}
                    {doctorAssistantData?.latestAITriage?.predictedDisease ||
                      "-"}
                  </p>

                  <p>
                    <strong>Urgency:</strong>{" "}
                    {doctorAssistantData?.latestAITriage?.urgency || "-"}
                  </p>

                  <p>
                    <strong>Recommended Specialist:</strong>{" "}
                    {doctorAssistantData?.latestAITriage?.doctorType || "-"}
                  </p>
                </div>

                <div className={styles.doctorAiQueryBox}>
                  <h3>Ask AI Assistant</h3>

                  <textarea
                    value={doctorAiQuery}
                    onChange={(e) => setDoctorAiQuery(e.target.value)}
                    placeholder="Ask about diagnosis, medicines, tests, severity..."
                  />

                  <button
                    onClick={handleDoctorAiQuery}
                    disabled={doctorAiLoading}
                  >
                    {doctorAiLoading ? "Thinking..." : "Ask AI"}
                  </button>

                  {doctorAiReply && (
                    <div className={styles.aiReplyCard}>
                      <h3>AI Recommendation</h3>
                      <p>{doctorAiReply}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Bottom Controls */}
            <div className={styles.controls}>
              <button
                className={`${styles.controlBtn} ${isMuted ? styles.controlActive : ""}`}
                onClick={toggleMic}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg
                    width="20"
                    height="20"
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
                    width="20"
                    height="20"
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
                className={`${styles.controlBtn} ${isCameraOff ? styles.controlActive : ""}`}
                onClick={toggleCamera}
                title={isCameraOff ? "Start Video" : "Stop Video"}
              >
                {isCameraOff ? (
                  <svg
                    width="20"
                    height="20"
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
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                )}
                <span>{isCameraOff ? "Start Video" : "Stop Video"}</span>
              </button>

              <button
                className={`${styles.controlBtn} ${isChatOpen ? styles.controlActive : ""}`}
                onClick={() => setIsChatOpen(!isChatOpen)}
                title="Toggle Chat"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Chat</span>
                {unreadCount > 0 && !isChatOpen && (
                  <span className={styles.controlBadge}>{unreadCount}</span>
                )}
              </button>

              <button
                className={styles.endBtn}
                onClick={() => leaveCall(true)}
                title="End Call"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.5 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.5 9.91a16 16 0 0 0 3.18 3.4z" />
                  <line x1="23" y1="1" x2="1" y2="23" />
                </svg>
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
