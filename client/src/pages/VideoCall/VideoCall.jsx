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
  const [connectionError, setConnectionError] = useState("");
  const [debugInfo, setDebugInfo] = useState({
    mySocketId: "",
    usersInRoom: 0,
  });

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const mySocketId = useRef(null);

  /*
  ==================================================
  INITIATOR (FIRST USER)
  ==================================================
  */

  const createInitiatorPeer = useCallback((otherSocketId) => {
    console.log("[INITIATOR] Creating peer →", otherSocketId);

    if (connectionRef.current) {
      console.log("[INITIATOR] Peer already exists");
      return;
    }

    if (!streamRef.current) {
      console.log("[INITIATOR] No local stream");
      return;
    }

    const peer = new Peer({
      initiator: true,

      /*
      IMPORTANT FIX:
      Use FALSE for localhost stability
      */

      trickle: false,

      stream: streamRef.current,

      config: {
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
            ],
          },
        ],
      },
    });

    peer.on("signal", (signalData) => {
      console.log("[INITIATOR] Sending offer");

      socketRef.current?.emit("call-user", {
        userToCall: otherSocketId,
        signalData,
        from: mySocketId.current,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log("[INITIATOR] Remote stream received");

      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }

      setCallStatus("connected");
    });

    peer.on("error", (err) => {
      console.error("[INITIATOR] Peer error:", err);
      setConnectionError("Connection failed. Refresh page.");
      connectionRef.current = null;
    });

    peer.on("close", () => {
      console.log("[INITIATOR] Peer closed");
      connectionRef.current = null;
      setCallStatus("ended");
    });

    connectionRef.current = peer;
    setCallStatus("connecting");
  }, []);

  /*
  ==================================================
  RECEIVER (SECOND USER)
  ==================================================
  */

  const createReceiverPeer = useCallback((callerId, callerSignal) => {
    console.log("[RECEIVER] Answering →", callerId);

    if (connectionRef.current) {
      console.log("[RECEIVER] Peer already exists");
      return;
    }

    if (!streamRef.current) {
      console.log("[RECEIVER] No local stream");
      return;
    }

    const peer = new Peer({
      initiator: false,

      /*
      IMPORTANT FIX:
      Use FALSE for localhost stability
      */

      trickle: false,

      stream: streamRef.current,

      config: {
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
            ],
          },
        ],
      },
    });

    peer.on("signal", (signalData) => {
      console.log("[RECEIVER] Sending answer");

      socketRef.current?.emit("answer-call", {
        to: callerId,
        signal: signalData,
      });
    });

    peer.on("stream", (remoteStream) => {
      console.log("[RECEIVER] Remote stream received");

      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }

      setCallStatus("connected");
    });

    peer.on("error", (err) => {
      console.error("[RECEIVER] Peer error:", err);
      setConnectionError("Connection failed. Refresh page.");
      connectionRef.current = null;
    });

    peer.on("close", () => {
      console.log("[RECEIVER] Peer closed");
      connectionRef.current = null;
      setCallStatus("ended");
    });

    /*
    Apply received offer
    */

    peer.signal(callerSignal);

    connectionRef.current = peer;
    setCallStatus("connecting");
  }, []);

  /*
  ==================================================
  MAIN SETUP
  ==================================================
  */

  useEffect(() => {
    let mounted = true;

    const setupVideoCall = async () => {
      try {
        /*
        Get camera + mic
        */

        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;

        streamRef.current = localStream;

        if (myVideo.current) {
          myVideo.current.srcObject = localStream;
        }

        /*
        Socket connection
        */

        const socket = io(SOCKET_URL, {
          transports: ["websocket"],
          reconnection: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("[SOCKET] Connected:", socket.id);

          mySocketId.current = socket.id;

          setDebugInfo({
            mySocketId: socket.id,
            usersInRoom: 1,
          });

          /*
          Join same consultation room
          */

          socket.emit("join-room", consultationId);

          setCallStatus("waiting");
        });

        /*
        FIRST USER:
        receives second user joined
        ONLY initiator starts here
        */

        socket.on("other-user", ({ socketId, shouldInitiate, usersInRoom }) => {
          console.log("[SOCKET] other-user:", socketId, shouldInitiate);

          setDebugInfo((prev) => ({
            ...prev,
            usersInRoom: usersInRoom || 2,
          }));

          if (shouldInitiate) {
            if (!connectionRef.current) {
              createInitiatorPeer(socketId);
            }
          }
        });

        /*
        SECOND USER:
        just waits
        */

        socket.on("existing-user", ({ socketId, usersInRoom }) => {
          console.log("[SOCKET] existing-user:", socketId);

          setDebugInfo((prev) => ({
            ...prev,
            usersInRoom: usersInRoom || 2,
          }));
        });

        /*
        SECOND USER:
        receives incoming offer
        */

        socket.on("incoming-call", ({ signal, from }) => {
          console.log("[SOCKET] incoming-call from:", from);

          if (!connectionRef.current) {
            createReceiverPeer(from, signal);
          }
        });

        /*
        FIRST USER:
        receives answer
        */

        socket.on("call-accepted", (signal) => {
          console.log("[SOCKET] call accepted");

          if (connectionRef.current) {
            connectionRef.current.signal(signal);
          }
        });

        /*
        End call handling
        */

        socket.on("call-ended", () => {
          console.log("[SOCKET] Call ended");

          connectionRef.current?.destroy();
          connectionRef.current = null;

          if (userVideo.current) {
            userVideo.current.srcObject = null;
          }

          setCallStatus("ended");
        });

        /*
        Consultation status update
        */

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

    setupVideoCall();

    return () => {
      mounted = false;

      streamRef.current?.getTracks().forEach((track) => track.stop());

      connectionRef.current?.destroy();
      connectionRef.current = null;

      if (socketRef.current) {
        socketRef.current.emit("end-call");
        socketRef.current.disconnect();
      }
    };
  }, [consultationId, createInitiatorPeer, createReceiverPeer]);

  /*
  ==================================================
  END CALL
  ==================================================
  */

  const leaveCall = async () => {
    connectionRef.current?.destroy();
    connectionRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());

    socketRef.current?.emit("end-call");
    socketRef.current?.disconnect();

    try {
      await consultationApi.updateConsultationStatus(consultationId, {
        status: "completed",
      });
    } catch (err) {
      console.log(err);
    }

    navigate("/dashboard");
  };

  return (
    <div className={styles.page}>
      <h1>Live Consultation</h1>

      <div className={styles.debugBanner}>
        Room: {consultationId} | Users: {debugInfo.usersInRoom}/2
      </div>

      {connectionError && (
        <div className={styles.errorBanner}>{connectionError}</div>
      )}

      <div className={styles.videoGrid}>
        <div className={styles.videoCard}>
          <h3>You</h3>

          <video
            ref={myVideo}
            playsInline
            muted
            autoPlay
            className={styles.video}
          />
        </div>

        <div className={styles.videoCard}>
          <h3>Participant</h3>

          <video
            ref={userVideo}
            playsInline
            autoPlay
            className={styles.video}
          />
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.endBtn} onClick={leaveCall}>
          End Call
        </button>
      </div>
    </div>
  );
}
