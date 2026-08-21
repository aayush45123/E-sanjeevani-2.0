import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { consultationApi, medicalRecordApi, apiClient } from "../../utils/api";
import NotificationService from "../../utils/notificationService";
import Sidebar from "../../components/Sidebar/Sidebar";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";
import { VideoCallSkeleton } from "../../components/Skeletons";
import { CheckCircle, FileText, X } from "lucide-react";
import styles from "./VideoCall.module.css";

const SOCKET_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "https://e-sanjeevani-2-0.onrender.com";

  
export default function VideoCall() {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [connectionError, setConnectionError] = useState("");
  const [usersInRoom, setUsersInRoom] = useState(1);
  const [callStatus, setCallStatus] = useState("connecting");
  const [patientJoined, setPatientJoined] = useState(false);
  const [doctorJoined, setDoctorJoined] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);

  // Doctor AI Assistant State
  const [doctorAssistantData, setDoctorAssistantData] = useState(null);
  const [doctorAiQuery, setDoctorAiQuery] = useState("");
  const [doctorAiReply, setDoctorAiReply] = useState("");
  const [doctorAiLoading, setDoctorAiLoading] = useState(false);

  // Doctor Clinical Workspace State
  const [clinicalTab, setClinicalTab] = useState("info"); // 'info' | 'prescription' | 'ai'
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxMedicines, setRxMedicines] = useState([
    { medicineName: "", dosage: "", route: "Oral", frequency: "", duration: "", instructions: "" },
  ]);
  const [rxAdvice, setRxAdvice] = useState("");
  const [rxTests, setRxTests] = useState("");
  const [rxReferralInfo, setRxReferralInfo] = useState("");
  const [rxFollowUpRequired, setRxFollowUpRequired] = useState(false);
  const [rxFollowUpDays, setRxFollowUpDays] = useState(7);
  const [rxDoctorNotes, setRxDoctorNotes] = useState("");
  const [rxSubmitting, setRxSubmitting] = useState(false);
  const [rxSuccess, setRxSuccess] = useState(null); // { pdfUrl, message }
  const [rxError, setRxError] = useState("");
  const [pipMinimized, setPipMinimized] = useState(false);

  const userRole = localStorage.getItem("userRole");

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
  const dataChannelRef = useRef(null);
  // Buffer ICE candidates that arrive before setRemoteDescription
  const iceCandidateQueueRef = useRef([]);

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
      const response = await apiClient.get(
        `/chat/consultation/${consultationId}/messages`
      );

      const data = response.data;

      if (data && data.data) {
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
      await apiClient.post(`/chat/consultation/${consultationId}/save`, {
        consultationId,
        text,
        senderName,
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
    console.log("🌐 [WebRTC] Creating new RTCPeerConnection");
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit("ice-candidate", {
          consultationId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      console.log("🎥 [WebRTC] Remote stream track received:", event.streams);
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        setRemoteStream(stream);
        if (remoteVideo.current) {
          remoteVideo.current.srcObject = stream;
        }
        setCallStatus("active");
        startTimer();
      }
    };

    peer.ondatachannel = (event) => {
      console.log("💬 [DataChannel] Remote data channel received");
      const channel = event.channel;
      setupDataChannel(channel);
      dataChannelRef.current = channel;
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          peer.addTrack(track, localStreamRef.current);
          console.log(`➕ [WebRTC] Added local track (${track.kind})`);
        } catch (e) {
          console.warn("Track addition warning:", e);
        }
      });
    } else {
      console.warn("⚠️ [WebRTC] localStreamRef.current is empty when creating peer connection!");
    }

    peerRef.current = peer;
    return peer;
  }, [consultationId]);

  useEffect(() => {
    if (remoteStream && remoteVideo.current) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream, callStatus]);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        const response = await apiClient.get(
          `/doctor-assistant/data/${consultationId}`
        );

        if (response.data?.success) {
          setDoctorAssistantData(response.data.data);
        }
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.warn("Doctor Assistant Warning:", error);
        }
      }
    };

    fetchDoctorAssistantData();
  }, [consultationId, userRole]);

  /*
  =============================================
  INIT
  =============================================
  */
  useEffect(() => {
    NotificationService.requestPermission().catch((err) =>
      console.error("Notification permission error:", err),
    );
  }, []);

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
          console.log("🔌 Socket connected, joining room...");
          socket.emit("join-room", {
            consultationId,
            userRole,
            userName,
          });
        });

        socket.on(
          "room-join-confirmed",
          async ({ consultationId: roomId, usersInRoom }) => {
            console.log(
              `📍 Successfully joined room ${roomId}. Users in room: ${usersInRoom}`,
            );

            apiClient
              .post(`/consultations/${consultationId}/mark-joined`)
              .then((res) => {
                if (res.data?.success) {
                  console.log("✅ User marked as joined:", res.data.consultation);
                }
              })
              .catch((error) =>
                console.error("Error marking user joined:", error),
              );
          },
        );

        // Helper: flush queued ICE candidates after remote description is set
        const flushIceCandidateQueue = async () => {
          if (!peerRef.current || !peerRef.current.remoteDescription) return;
          const queue = [...iceCandidateQueueRef.current];
          iceCandidateQueueRef.current = [];
          if (queue.length > 0) {
            console.log(`[ICE] Flushing ${queue.length} queued ICE candidates...`);
          }
          for (const c of queue) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(c));
              console.log("✅ [ICE] Flushed candidate added successfully");
            } catch (err) {
              console.warn("[ICE] Failed to flush queued candidate:", err);
            }
          }
        };

        // First user — create offer + data channel
        socket.on("other-user", async ({ shouldInitiate, usersInRoom }) => {
          console.log("👥 [WebRTC] other-user event. shouldInitiate:", shouldInitiate);
          setUsersInRoom(usersInRoom || 2);
          loadChatHistory();

          if (!shouldInitiate) return;

          const peer = createPeerConnection();

          const channel = peer.createDataChannel("chat");
          setupDataChannel(channel);
          dataChannelRef.current = channel;

          console.log("📤 [WebRTC] Creating offer...");
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
          console.log("📞 [WebRTC] incoming-call event from:", from);
          let peer = peerRef.current || createPeerConnection();
          await peer.setRemoteDescription(new RTCSessionDescription(signal));
          console.log("✅ [WebRTC] Remote description set (Offer)");
          await flushIceCandidateQueue();

          console.log("📤 [WebRTC] Creating answer...");
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("answer-call", { consultationId, signal: answer });
        });

        // First user — receive answer
        socket.on("call-accepted", async (signal) => {
          console.log("✅ [WebRTC] call-accepted answer received");
          if (!peerRef.current) return;
          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(signal),
          );
          console.log("✅ [WebRTC] Remote description set (Answer)");
          await flushIceCandidateQueue();
        });

        // ICE exchange
        socket.on("ice-candidate", async ({ candidate }) => {
          if (!candidate) return;
          // If peer exists and remote description is set, add immediately
          if (
            peerRef.current &&
            peerRef.current.remoteDescription &&
            peerRef.current.remoteDescription.type
          ) {
            try {
              await peerRef.current.addIceCandidate(
                new RTCIceCandidate(candidate),
              );
              console.log("✅ [ICE] Candidate added directly");
            } catch (err) {
              console.warn("[ICE] addIceCandidate error:", err);
            }
          } else {
            // Queue the candidate — remote description not ready yet
            console.log("[ICE] Queueing candidate (remote description not set)");
            iceCandidateQueueRef.current.push(candidate);
          }
        });

        socket.on("existing-user", ({ usersInRoom }) => {
          setUsersInRoom(usersInRoom || 2);
        });

        socket.on("user-joined", async ({ userRole, userName }) => {
          console.log(`✅ ${userRole} ${userName} has joined!`);
          await NotificationService.userJoinedNotification(userName, userRole);
          const roleText = userRole === "doctor" ? "Dr." : "Patient";
          NotificationService.showToast(
            `${roleText} ${userName} has joined the consultation!`,
            "success",
          );
        });

        socket.on(
          "user-status-updated",
          ({
            userRole,
            userJoined,
            message,
            patientJoined: patJoined,
            doctorJoined: docJoined,
          }) => {
            console.log(`📢 Status Update: ${message}`);
            setPatientJoined(patJoined);
            setDoctorJoined(docJoined);

            const roleText = userRole === "doctor" ? "Doctor" : "Patient";
            if (userJoined) {
              NotificationService.showToast(`${message}`, "info");
              console.log(`🔔 ${roleText} has joined the consultation`);
            }
            console.log(
              `Patient joined: ${patJoined}, Doctor joined: ${docJoined}`,
            );
          },
        );

        // 🔔 PARTICIPANT WAITING - Other user has joined but this user hasn't
        socket.on(
          "participant-waiting",
          ({ waitingUserRole, waitingUserName, message, timestamp }) => {
            console.log(`⏳ ${message}`);
            const roleText = waitingUserRole === "doctor" ? "Dr." : "Patient";
            NotificationService.showToast(
              `${roleText} ${waitingUserName} is waiting for you to join the consultation!`,
              "warning",
            );
            // Also play a sound alert to get attention
            NotificationService.playSound("alert");
          },
        );

        /*
        =============================================
        FIX: call-ended now navigates AND does NOT
        re-emit end-call (prevents infinite loop)
        =============================================
        */
        socket.on("call-ended", ({ message, endedAt }) => {
          console.log("🔴 Call ended by the other participant");
          NotificationService.showToast(
            message || "Consultation has ended",
            "warning",
          );
          // shouldNavigate = true, shouldEmit = false (avoid loop)
          leaveCall(true, false);
        });

        try {
          await consultationApi.updateConsultationStatus(consultationId, {
            status: "ongoing",
          });
        } catch (err) {
          // Quietly ignore status permission error if already set
        }

      } catch (err) {
        console.warn("Media devices / connection notice:", err?.name, err?.message || err);
        
        // If webcam is in use by another tab or window, try audio-only fallback
        if (err?.name === "NotReadableError" || err?.name === "TrackStartError" || String(err?.message || "").includes("in use")) {
          try {
            console.log("Attempting audio-only stream fallback...");
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = audioStream;
            setIsCameraOff(true);
            setConnectionError("Camera is in use by another tab/app (Audio only active)");
            setCallStatus("connected");
            return;
          } catch (audioErr) {
            console.warn("Audio fallback also failed:", audioErr);
          }
          setConnectionError("Camera/Microphone is in use by another tab. Please close other video call tabs.");
        } else {
          setConnectionError("Camera / microphone permission required");
        }
        setCallStatus("ready");
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
  DOCTOR AI QUERY
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

      const response = await apiClient.post("/chat", {
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
      });

      const data = response.data;

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
  PRESCRIPTION PANEL HELPERS
  =============================================
  */
  const addMedicineRow = () => {
    setRxMedicines((prev) => [
      ...prev,
      { medicineName: "", dosage: "", route: "Oral", frequency: "", duration: "", instructions: "" },
    ]);
  };

  const removeMedicineRow = (idx) => {
    setRxMedicines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMedicineRow = (idx, field, value) => {
    setRxMedicines((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const handleIssuePrescription = async () => {
    setRxError("");
    if (!rxDiagnosis.trim()) {
      setRxError("Diagnosis is required before issuing a prescription.");
      return;
    }

    const validMeds = rxMedicines.filter((m) => m.medicineName.trim());

    setRxSubmitting(true);
    try {
      const res = await medicalRecordApi.issuePrescription({
        consultationId,
        diagnosis: rxDiagnosis.trim(),
        prescriptionItems: validMeds,
        advice: rxAdvice.trim(),
        recommendedTests: rxTests.trim(),
        referralInfo: rxReferralInfo.trim(),
        followUpRequired: rxFollowUpRequired,
        followUpDays: rxFollowUpRequired ? Number(rxFollowUpDays) : null,
        doctorNotes: rxDoctorNotes.trim(),
      });

      setRxSuccess({
        message: res.data.message || "Prescription issued successfully!",
        pdfUrl: res.data.record?.prescriptionPdfUrl || null,
      });
      NotificationService.showToast("Digital prescription issued!", "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to issue prescription.";
      setRxError(msg);
    } finally {
      setRxSubmitting(false);
    }
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

  /*
  =============================================
  LEAVE CALL
  - shouldNavigate: redirect to dashboard?
  - shouldEmit: send end-call signal to peer?
    (false when WE received the signal to avoid loop)
  =============================================
  */
  const leaveCall = async (shouldNavigate = true, shouldEmit = true) => {
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

    if (shouldEmit && socketRef.current) {
      socketRef.current.emit("end-call");
      console.log("🔴 End call signal sent to other participant");
      // Small delay to ensure socket message is delivered before disconnect
      setTimeout(() => {
        socketRef.current?.disconnect();
      }, 100);
    } else {
      socketRef.current?.disconnect();
    }

    if (shouldNavigate) {
      setTimeout(() => {
        navigate("/dashboard");
      }, 200);
    }
  };

  const sidebarWidth = userRole === "doctor" ? 230 : 260;

  if (callStatus === "connecting") {
    return <VideoCallSkeleton />;
  }

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

            {/* Main (remote) video */}
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
                  <div
                    style={{
                      marginTop: "20px",
                      fontSize: "14px",
                      opacity: 0.8,
                    }}
                  >
                    <p>
                      Status:{" "}
                      {userRole === "doctor" ? (
                        <>
                          Patient:{" "}
                          <strong
                            style={{
                              color: patientJoined ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {patientJoined ? "✓ Joined" : "Waiting..."}
                          </strong>
                        </>
                      ) : (
                        <>
                          Doctor:{" "}
                          <strong
                            style={{
                              color: doctorJoined ? "#22c55e" : "#ef4444",
                            }}
                          >
                            {doctorJoined ? "✓ Joined" : "Waiting..."}
                          </strong>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}
              <div className={styles.mainVideoLabel}>
                {userRole === "doctor" ? "Patient" : "Doctor"}
              </div>
            </div>

            {/* PiP (self) video — click the toggle to minimize/expand */}
            <div
              className={`${styles.pipWrapper} ${pipMinimized ? styles.pipMinimized : ""}`}
              title={pipMinimized ? "Expand camera" : "Minimize camera"}
            >
              {!pipMinimized && (
                <>
                  <video
                    ref={myVideo}
                    autoPlay
                    playsInline
                    muted
                    className={`${styles.pipVideo} ${isCameraOff ? styles.videoOff : ""}`}
                  />
                  {isCameraOff && (
                    <div className={styles.cameraOffOverlay}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="#94a3b8" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                  <div className={styles.pipLabel}>You</div>
                </>
              )}

              {/* Minimize / expand toggle */}
              <button
                className={styles.pipToggleBtn}
                onClick={() => setPipMinimized((v) => !v)}
                title={pipMinimized ? "Expand" : "Minimize"}
              >
                {pipMinimized ? "⛶" : "−"}
              </button>
            </div>

            {/* DOCTOR CLINICAL WORKSPACE PANEL */}
            {userRole === "doctor" && (
              <div className={styles.clinicalPanel}>
                {/* Panel Header */}
                <div className={styles.clinicalPanelHeader}>
                  <span className={styles.clinicalPanelTitle}>Clinical Workspace</span>
                  <span className={styles.clinicalPanelPatient}>
                    {doctorAssistantData?.patientBasicInfo?.name || "Patient"}
                  </span>
                </div>

                {/* Tab Bar */}
                <div className={styles.clinicalTabs}>
                  <button
                    className={`${styles.clinicalTab} ${clinicalTab === "info" ? styles.clinicalTabActive : ""}`}
                    onClick={() => setClinicalTab("info")}
                  >
                    Patient Info
                  </button>
                  <button
                    className={`${styles.clinicalTab} ${clinicalTab === "prescription" ? styles.clinicalTabActive : ""}`}
                    onClick={() => setClinicalTab("prescription")}
                  >
                    Prescription
                  </button>
                  <button
                    className={`${styles.clinicalTab} ${clinicalTab === "ai" ? styles.clinicalTabActive : ""}`}
                    onClick={() => setClinicalTab("ai")}
                  >
                    AI Assistant
                  </button>
                </div>

                {/* Tab Content */}
                <div className={styles.clinicalTabContent}>

                  {/* ── PATIENT INFO TAB ── */}
                  {clinicalTab === "info" && (
                    <div className={styles.infoTab}>
                      <div className={styles.infoSection}>
                        <div className={styles.infoSectionTitle}>Basic Information</div>
                        <div className={styles.infoGrid}>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Name</span>
                            <span className={styles.infoValue}>{doctorAssistantData?.patientBasicInfo?.name || "—"}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Age</span>
                            <span className={styles.infoValue}>{doctorAssistantData?.patientProfile?.age || "—"}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Gender</span>
                            <span className={styles.infoValue}>{doctorAssistantData?.patientProfile?.gender || "—"}</span>
                          </div>
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Blood Group</span>
                            <span className={styles.infoValue}>{doctorAssistantData?.patientProfile?.bloodGroup || "—"}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.infoSection}>
                        <div className={styles.infoSectionTitle}>Medical History</div>
                        <div className={styles.infoChipRow}>
                          {doctorAssistantData?.patientProfile?.medicalHistory ? (
                            <span className={styles.infoChip}>{doctorAssistantData.patientProfile.medicalHistory}</span>
                          ) : <span className={styles.infoNone}>None reported</span>}
                        </div>
                      </div>

                      <div className={styles.infoSection}>
                        <div className={styles.infoSectionTitle}>Allergies</div>
                        <div className={styles.infoChipRow}>
                          {doctorAssistantData?.patientProfile?.allergies ? (
                            <span className={`${styles.infoChip} ${styles.infoChipRed}`}>{doctorAssistantData.patientProfile.allergies}</span>
                          ) : <span className={styles.infoNone}>None reported</span>}
                        </div>
                      </div>

                      <div className={styles.infoSection}>
                        <div className={styles.infoSectionTitle}>Current Medications</div>
                        <div className={styles.infoChipRow}>
                          {doctorAssistantData?.patientProfile?.currentMedications ? (
                            <span className={styles.infoChip}>{doctorAssistantData.patientProfile.currentMedications}</span>
                          ) : <span className={styles.infoNone}>None reported</span>}
                        </div>
                      </div>

                      {doctorAssistantData?.latestAITriage && (
                        <div className={styles.infoSection}>
                          <div className={styles.infoSectionTitle}>AI Triage Result</div>
                          <div className={styles.aiTriageBadge}>
                            <div className={styles.triageRow}>
                              <span className={styles.triageLabel}>Predicted Disease</span>
                              <span className={styles.triageValue}>{doctorAssistantData.latestAITriage.predictedDisease || "—"}</span>
                            </div>
                            <div className={styles.triageRow}>
                              <span className={styles.triageLabel}>Urgency</span>
                              <span className={`${styles.triageValue} ${styles.urgencyBadge}`} data-urgency={doctorAssistantData.latestAITriage.urgency?.toLowerCase()}>
                                {doctorAssistantData.latestAITriage.urgency || "—"}
                              </span>
                            </div>
                            <div className={styles.triageRow}>
                              <span className={styles.triageLabel}>Recommended Specialist</span>
                              <span className={styles.triageValue}>{doctorAssistantData.latestAITriage.doctorType || "—"}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {doctorAssistantData?.consultationDetails && (
                        <div className={styles.infoSection}>
                          <div className={styles.infoSectionTitle}>Presenting Complaints</div>
                          <p className={styles.infoText}>
                            {doctorAssistantData.consultationDetails.symptoms || doctorAssistantData.consultationDetails.problemDescription || "No complaints recorded."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── PRESCRIPTION TAB ── */}
                  {clinicalTab === "prescription" && (
                    <div className={styles.rxTab}>
                      {rxSuccess ? (
                        <div className={styles.rxSuccessCard}>
                          <div className={styles.rxSuccessIcon}><CheckCircle size={32} color="#16a34a" /></div>
                          <h3>Prescription Issued!</h3>
                          <p>{rxSuccess.message}</p>
                          {rxSuccess.pdfUrl && (
                            <a
                              href={rxSuccess.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.rxPdfDownload}
                            >
                              <FileText size={16} /> Download Prescription PDF
                            </a>
                          )}
                          <button
                            className={styles.rxNewBtn}
                            onClick={() => {
                              setRxSuccess(null);
                              setRxDiagnosis("");
                              setRxMedicines([{ medicineName: "", dosage: "", route: "Oral", frequency: "", duration: "", instructions: "" }]);
                              setRxAdvice("");
                              setRxTests("");
                              setRxReferralInfo("");
                              setRxFollowUpRequired(false);
                              setRxFollowUpDays(7);
                              setRxDoctorNotes("");
                            }}
                          >
                            Write New Prescription
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Diagnosis */}
                          <div className={styles.rxField}>
                            <label className={styles.rxLabel}>Diagnosis *</label>
                            <input
                              className={styles.rxInput}
                              placeholder="e.g. Viral Upper Respiratory Infection"
                              value={rxDiagnosis}
                              onChange={(e) => setRxDiagnosis(e.target.value)}
                            />
                          </div>

                          {/* Medicines */}
                          <div className={styles.rxField}>
                            <label className={styles.rxLabel}>Medicines (Rx)</label>
                            <div className={styles.rxMedsList}>
                              {rxMedicines.map((med, idx) => (
                                <div key={idx} className={styles.rxMedCard}>
                                  <div className={styles.rxMedHeader}>
                                    <span className={styles.rxMedNum}>Medicine {idx + 1}</span>
                                    {rxMedicines.length > 1 && (
                                      <button
                                        className={styles.rxMedRemove}
                                        onClick={() => removeMedicineRow(idx)}
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                  <div className={styles.rxMedRow}>
                                    <div className={styles.rxMedFieldFull}>
                                      <label className={styles.rxMiniLabel}>Medicine name</label>
                                      <input
                                        className={styles.rxInput}
                                        placeholder="Paracetamol"
                                        value={med.medicineName}
                                        onChange={(e) => updateMedicineRow(idx, "medicineName", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className={styles.rxMedRow}>
                                    <div className={styles.rxMedField}>
                                      <label className={styles.rxMiniLabel}>Dosage</label>
                                      <input
                                        className={styles.rxInput}
                                        placeholder="500mg"
                                        value={med.dosage}
                                        onChange={(e) => updateMedicineRow(idx, "dosage", e.target.value)}
                                      />
                                    </div>
                                    <div className={styles.rxMedField}>
                                      <label className={styles.rxMiniLabel}>Route</label>
                                      <select
                                        className={styles.rxSelect}
                                        value={med.route || "Oral"}
                                        onChange={(e) => updateMedicineRow(idx, "route", e.target.value)}
                                      >
                                        <option value="Oral">Oral</option>
                                        <option value="Sublingual">Sublingual</option>
                                        <option value="Intravenous">IV (Intravenous)</option>
                                        <option value="Intramuscular">IM (Intramuscular)</option>
                                        <option value="Subcutaneous">Subcutaneous</option>
                                        <option value="Topical">Topical</option>
                                        <option value="Inhaled">Inhaled</option>
                                        <option value="Nasal">Nasal</option>
                                        <option value="Ophthalmic">Ophthalmic</option>
                                        <option value="Otic">Otic (Ear)</option>
                                        <option value="Rectal">Rectal</option>
                                        <option value="Transdermal">Transdermal</option>
                                      </select>
                                    </div>
                                    <div className={styles.rxMedField}>
                                      <label className={styles.rxMiniLabel}>Frequency</label>
                                      <select
                                        className={styles.rxSelect}
                                        value={med.frequency}
                                        onChange={(e) => updateMedicineRow(idx, "frequency", e.target.value)}
                                      >
                                        <option value="">Select</option>
                                        <option value="Once daily">Once daily</option>
                                        <option value="Twice daily">Twice daily</option>
                                        <option value="Three times daily">Three times daily</option>
                                        <option value="Four times daily">Four times daily</option>
                                        <option value="Every 8 hours">Every 8 hours</option>
                                        <option value="Every 12 hours">Every 12 hours</option>
                                        <option value="At night">At night</option>
                                        <option value="As needed">As needed</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className={styles.rxMedRow}>
                                    <div className={styles.rxMedField}>
                                      <label className={styles.rxMiniLabel}>Duration</label>
                                      <input
                                        className={styles.rxInput}
                                        placeholder="5 days"
                                        value={med.duration}
                                        onChange={(e) => updateMedicineRow(idx, "duration", e.target.value)}
                                      />
                                    </div>
                                    <div className={styles.rxMedField}>
                                      <label className={styles.rxMiniLabel}>Instructions</label>
                                      <input
                                        className={styles.rxInput}
                                        placeholder="After food"
                                        value={med.instructions}
                                        onChange={(e) => updateMedicineRow(idx, "instructions", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button className={styles.rxAddMedBtn} onClick={addMedicineRow}>
                                + Add Medicine
                              </button>
                            </div>
                          </div>

                          {/* Advice */}
                          <div className={styles.rxField}>
                            <label className={styles.rxLabel}>Advice</label>
                            <textarea
                              className={styles.rxTextarea}
                              placeholder="Rest, adequate hydration..."
                              value={rxAdvice}
                              onChange={(e) => setRxAdvice(e.target.value)}
                              rows={2}
                            />
                          </div>

                          {/* Recommended Tests */}
                          <div className={styles.rxField}>
                            <label className={styles.rxLabel}>Recommended Tests</label>
                            <input
                              className={styles.rxInput}
                              placeholder="CBC, LFT, X-Ray..."
                              value={rxTests}
                              onChange={(e) => setRxTests(e.target.value)}
                            />
                          </div>

                          {/* Referral Info */}
                          <div className={styles.rxField}>
                            <label className={styles.rxLabel}>Referral Info</label>
                            <input
                              className={styles.rxInput}
                              placeholder="Refer to Cardiologist / AIIMS Neurology Dept..."
                              value={rxReferralInfo}
                              onChange={(e) => setRxReferralInfo(e.target.value)}
                            />
                          </div>

                          {/* Follow-Up */}
                          <div className={styles.rxField}>
                            <label className={styles.rxLabel}>Follow-Up</label>
                            <div className={styles.rxFollowRow}>
                              <label className={styles.rxCheckboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={rxFollowUpRequired}
                                  onChange={(e) => setRxFollowUpRequired(e.target.checked)}
                                />
                                Follow-up required
                              </label>
                              {rxFollowUpRequired && (
                                <div className={styles.rxFollowDays}>
                                  <span>After</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={90}
                                    value={rxFollowUpDays}
                                    onChange={(e) => setRxFollowUpDays(e.target.value)}
                                    className={styles.rxDaysInput}
                                  />
                                  <span>days</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Doctor Notes */}
                          <div className={styles.rxField}>
                            <label className={styles.rxLabel}>Additional Doctor Notes</label>
                            <textarea
                              className={styles.rxTextarea}
                              placeholder="Internal notes (not shown to patient)..."
                              value={rxDoctorNotes}
                              onChange={(e) => setRxDoctorNotes(e.target.value)}
                              rows={2}
                            />
                          </div>

                          {rxError && <div className={styles.rxErrorMsg}>{rxError}</div>}

                          <div className={styles.rxActions}>
                            <button
                              className={styles.rxIssueBtn}
                              onClick={handleIssuePrescription}
                              disabled={rxSubmitting}
                            >
                              {rxSubmitting ? "Generating PDF..." : <><FileText size={16} /> Issue Final Prescription</>}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── AI ASSISTANT TAB ── */}
                  {clinicalTab === "ai" && (
                    <div className={styles.aiTab}>
                      <div className={styles.aiTabHint}>
                        Ask the AI assistant for diagnosis suggestions, medicine recommendations, or test guidance based on this patient.
                      </div>
                      <textarea
                        className={styles.aiTextarea}
                        value={doctorAiQuery}
                        onChange={(e) => setDoctorAiQuery(e.target.value)}
                        placeholder="Ask about diagnosis, medicines, tests, severity..."
                        rows={4}
                      />
                      <button
                        className={styles.aiAskBtn}
                        onClick={handleDoctorAiQuery}
                        disabled={doctorAiLoading}
                      >
                        {doctorAiLoading ? "Thinking..." : "Ask AI"}
                      </button>
                      {doctorAiReply && (
                        <div className={styles.aiReplyCard}>
                          <h4>AI Recommendation</h4>
                          <p>{doctorAiReply}</p>
                        </div>
                      )}
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
                onClick={() => leaveCall(true, true)}
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

        {/* Toast Notifications Container */}
        <div id="toast-container" className={styles.toastContainer}></div>
      </div>
    </div>
  );
}
