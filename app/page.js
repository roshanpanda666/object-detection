"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { load as cocossdload } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

const ObjectDetection = () => {
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [personDetected, setPersonDetected] = useState(false);
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);

  const canvasRef = useRef(null);
  const webcamRef = useRef(null);
  const cocoModelRef = useRef(null);

  const videoConstraints = useRef({}).current;

  const checkCameraPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionGranted(true);
      fetchDevices();
    } catch (error) {
      alert("Camera permission is required to proceed.");
      setLoading(false);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(
        (device) => device.kind === "videoinput"
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setCurrentDeviceId(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const detectObjects = useCallback(async () => {
    const net = cocoModelRef.current;

    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      const objects = await net.detect(video);

      const isPersonDetected = objects.some((item) => item.class === "person");
      const otherObjects = objects
        .filter((item) => item.class !== "person")
        .map((item) => item.class);

      if (isPersonDetected && !personDetected && !isAnnouncementActive) {
        setPersonDetected(true);
        announcePersonDetected(otherObjects);
      } else if (!isPersonDetected && personDetected) {
        setPersonDetected(false);
        stopAnnouncement();
      }

      drawDetections(objects, videoWidth, videoHeight);
    }
  }, [isAnnouncementActive, personDetected]);

  const drawDetections = useCallback((detections, videoWidth, videoHeight) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    detections.forEach((item) => {
      const [x, y, width, height] = item.bbox;
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = "#00FF00";
      ctx.font = "18px Arial";
      ctx.fillText(
        `${item.class} (${(item.score * 100).toFixed(1)}%)`,
        x,
        y > 10 ? y - 5 : 10
      );
    });
  }, []);

  const announcePersonDetected = useCallback((otherObjects) => {
    setIsAnnouncementActive(true);
    let msgText = "Person detected";
    if (otherObjects.length > 0) {
      msgText += ` with ${otherObjects.join(", ")}`;
    }

    const msg = new SpeechSynthesisUtterance(msgText);
    window.speechSynthesis.speak(msg);

    msg.onend = () => {
      setIsAnnouncementActive(false);
    };
  }, []);

  const stopAnnouncement = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsAnnouncementActive(false);
  }, []);

  useEffect(() => {
    checkCameraPermission();

    return () => {
      clearInterval(detectObjects);
      stopAnnouncement();
    };
  }, [checkCameraPermission, stopAnnouncement]);

  useEffect(() => {
    if (cameraPermissionGranted) {
      (async () => {
        cocoModelRef.current = await cocossdload();
        setLoading(false);
        setInterval(() => detectObjects(), 200);
      })();
    }
  }, [cameraPermissionGranted, detectObjects]);

  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-5xl font-mono">Object Detection</h1>
      {!cameraPermissionGranted ? (
        <div>Requesting camera permission...</div>
      ) : loading ? (
        <div>Loading devices...</div>
      ) : (
        <>
          <div className="mt-3">
            {devices.map((device, index) => (
              <button
                key={device.deviceId}
                className={`p-2 m-2 ${
                  device.deviceId === currentDeviceId
                    ? "bg-blue-500 text-white"
                    : "bg-black text-white"
                } border-2 border-white hover:bg-white hover:text-black rounded`}
                onClick={() => {
                  setCurrentDeviceId(device.deviceId);
                  videoConstraints.deviceId = { exact: device.deviceId };
                }}
              >
                {device.label || `Camera ${index + 1}`}
              </button>
            ))}
          </div>
          <div className="relative justify-center items-center mt-4">
            {currentDeviceId ? (
              <>
                <Webcam
                  ref={webcamRef}
                  className="lg:h-[520px] border border-gray-300 rounded"
                  videoConstraints={videoConstraints}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 z-10 w-full lg:h-[520px]"
                ></canvas>
              </>
            ) : (
              <p>No camera selected.</p>
            )}
          </div>
          <button
            className="p-3 mt-4 bg-red-500 text-white rounded"
            onClick={stopAnnouncement}
          >
            Stop Announcement
          </button>
        </>
      )}
    </div>
  );
};

export default ObjectDetection;
