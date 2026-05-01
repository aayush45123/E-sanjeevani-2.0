import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Peer from "simple-peer";
import styles from "./VideoCall.module.css";
import { consultationApi } from "../../utils/api";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  reconnection: true,
});

export default function VideoCall() {
  const { consultationId } = useParams();
  const navigate = useNavigate();

  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");
  const [otherUser, setOtherUser] = useState("");
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  /*
  =====================================
  GET CAMERA + JOIN ROOM
  =====================================
  */

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((currentStream) => {
        setStream(currentStream);

        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        socket.emit("join-room", consultationId);
      });

    /*
    My socket ID
    */

    socket.on("me", (id) => {
      setMe(id);
    });

    /*
    Someone else joined room
    */

    socket.on("other-user", (userId) => {
      setOtherUser(userId);
    });

    /*
    Incoming call signal
    */

    socket.on("incoming-call", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    /*
    Call accepted
    */

    socket.on("call-accepted", (signal) => {
      setCallAccepted(true);

      if (connectionRef.current) {
        connectionRef.current.signal(signal);
      }
    });

    /*
    Consultation status
    */

    consultationApi.updateConsultationStatus(consultationId, {
      status: "ongoing",
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  /*
  =====================================
  START CALL
  =====================================
  */

  const startCall = () => {
    if (!otherUser) {
      alert("Waiting for other participant to join...");
      return;
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signalData) => {
      socket.emit("call-user", {
        userToCall: otherUser,
        signalData,
        from: me,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    connectionRef.current = peer;
  };

  /*
  =====================================
  ANSWER CALL
  =====================================
  */

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (data) => {
      socket.emit("answer-call", {
        signal: data,
        to: caller,
      });
    });

    peer.on("stream", (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(callerSignal);

    connectionRef.current = peer;
  };

  /*
  =====================================
  END CALL
  =====================================
  */

  const leaveCall = async () => {
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      await consultationApi.updateConsultationStatus(consultationId, {
        status: "completed",
      });
    } catch (error) {
      console.error(error);
    }

    navigate("/dashboard");
  };

  return (
    <div className={styles.videoPage}>
      <h1 className={styles.title}>Live Consultation</h1>

      <div className={styles.videoGrid}>
        <div className={styles.videoCard}>
          <h3>Your Camera</h3>
          <video
            playsInline
            muted
            ref={myVideo}
            autoPlay
            className={styles.video}
          />
        </div>

        <div className={styles.videoCard}>
          <h3>Patient / Doctor</h3>
          <video
            playsInline
            ref={userVideo}
            autoPlay
            className={styles.video}
          />
        </div>
      </div>

      <div className={styles.actions}>
        {!callAccepted && (
          <button className={styles.joinBtn} onClick={startCall}>
            Start Call
          </button>
        )}

        {receivingCall && !callAccepted && (
          <button className={styles.answerBtn} onClick={answerCall}>
            Answer Call
          </button>
        )}

        <button className={styles.leaveBtn} onClick={leaveCall}>
          End Call
        </button>
      </div>
    </div>
  );
}
