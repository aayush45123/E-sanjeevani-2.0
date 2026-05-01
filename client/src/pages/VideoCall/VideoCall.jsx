import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import styles from "./VideoCall.module.css";
import { consultationApi } from "../../utils/api";
import Sidebar from "../../components/Sidebar/Sidebar";
import DoctorSidebar from "../../components/DoctorSidebar/DoctorSidebar";

const SOCKET_URL = "http://localhost:5000";

export default function VideoCall() {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [connectionError, setConnectionError] = useState("");
  const [usersInRoom, setUsersInRoom] = useState(0);
  const userRole = localStorage.getItem("userRole");

  const myVideo = useRef(null);
  const remoteVideo = useRef(null);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  /*
  ==================================================
  CREATE PEER CONNECTION
  ==================================================
  */

  const createPeerConnection = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["stun:stun.l.google.com:19302"],
        },
      ],
    });

    /*
    Send ICE candidates
    */

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          consultationId,
          candidate: event.candidate,
        });
      }
    };

    /*
    Receive remote stream
    */

    peer.ontrack = (event) => {
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = event.streams[0];
      }
    };

    /*
    Add local tracks
    */

    localStreamRef.current.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current);
    });

    peerRef.current = peer;
    return peer;
  };

  /*
  ==================================================
  START VIDEO CALL
  ==================================================
  */

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        /*
        Get camera + mic
        */

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) return;

        localStreamRef.current = stream;

        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }

        /*
        Connect socket
        */

        const socket = io(SOCKET_URL, {
          transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Socket connected:", socket.id);

          socket.emit("join-room", consultationId);
        });

        /*
        First user initiates
        */

        socket.on("other-user", async ({ shouldInitiate, usersInRoom }) => {
          setUsersInRoom(usersInRoom || 2);

          if (!shouldInitiate) return;

          const peer = createPeerConnection();

          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);

          socket.emit("call-user", {
            consultationId,
            signalData: offer,
            from: socket.id,
          });
        });

        /*
        Second user receives offer
        */

        socket.on("incoming-call", async ({ signal, from }) => {
          const peer = createPeerConnection();

          await peer.setRemoteDescription(new RTCSessionDescription(signal));

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("answer-call", {
            consultationId,
            signal: answer,
          });
        });

        /*
        First user receives answer
        */

        socket.on("call-accepted", async (signal) => {
          if (!peerRef.current) return;

          await peerRef.current.setRemoteDescription(
            new RTCSessionDescription(signal),
          );
        });

        /*
        ICE candidate exchange
        */

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

        /*
        Room status
        */

        socket.on("existing-user", ({ usersInRoom }) => {
          setUsersInRoom(usersInRoom || 2);
        });

        /*
        Call ended
        */

        socket.on("call-ended", () => {
          leaveCall(false);
        });

        /*
        Update consultation status
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

    init();

    return () => {
      mounted = false;

      localStreamRef.current?.getTracks().forEach((track) => track.stop());

      peerRef.current?.close();

      socketRef.current?.disconnect();
    };
  }, [consultationId]);

  /*
  ==================================================
  END CALL
  ==================================================
  */

  const leaveCall = async (shouldNavigate = true) => {
    try {
      await consultationApi.updateConsultationStatus(consultationId, {
        status: "completed",
      });
    } catch (err) {
      console.log(err);
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());

    peerRef.current?.close();
    socketRef.current?.emit("end-call");
    socketRef.current?.disconnect();

    if (shouldNavigate) {
      navigate("/dashboard");
    }
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar based on user role */}
      {userRole === "doctor" ? <DoctorSidebar /> : <Sidebar />}

      {/* Video Call Content */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          backgroundColor: "#f5f5f5",
          minHeight: "100vh",
        }}
      >
        <h1>Live Consultation</h1>

        <div className={styles.debugBanner}>
          Room: {consultationId} | Users: {usersInRoom}/2
        </div>

        {connectionError && (
          <div className={styles.errorBanner}>{connectionError}</div>
        )}

        <div className={styles.videoGrid}>
          <div className={styles.videoCard}>
            <h3>You</h3>
            <video
              ref={myVideo}
              autoPlay
              playsInline
              muted
              className={styles.video}
            />
          </div>

          <div className={styles.videoCard}>
            <h3>Participant</h3>
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className={styles.video}
            />
          </div>
        </div>

        <div className={styles.controls}>
          <button className={styles.endBtn} onClick={() => leaveCall(true)}>
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
