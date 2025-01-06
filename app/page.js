"use client";
import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { load as cocossdload } from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

let detectInterval;

const ObjectDetection = () => {
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [personDetected, setPersonDetected] = useState(false);
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);

  const canvasRef = useRef(null);
  const webcamRef = useRef(null);

  const runCoco = async () => {
    setLoading(true);
    const net = await cocossdload(); // Load coco-ssd model
    setLoading(false);

    // Start detection at intervals
    detectInterval = setInterval(() => {
      detectObjects(net);
    }, 100);
  };

  const detectObjects = async (net) => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4 // Check if webcam video is ready
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Set canvas dimensions to match video dimensions
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Perform object detection
      const objects = await net.detect(video);

      // Check if a person is detected and identify accompanying objects
      const isPersonDetected = objects.some((item) => item.class === "person");

      const otherObjects = objects
        .filter((item) => item.class !== "person")
        .map((item) => item.class);

      // Handle announcement logic
      if (isPersonDetected && !personDetected && !isAnnouncementActive) {
        setPersonDetected(true);
        announcePersonDetected(otherObjects);
      } else if (!isPersonDetected && personDetected) {
        setPersonDetected(false);
        stopAnnouncement();
      }

      // Draw results on the canvas
      drawDetections(objects, videoWidth, videoHeight);
    }
  };

  const announcePersonDetected = (otherObjects) => {
    setIsAnnouncementActive(true); // Activate announcement

    // Construct the announcement message
    let msgText = "Person detected";
    if (otherObjects.length > 0) {
      msgText += ` with ${otherObjects.join(", ")}`;
    }

    const msg = new SpeechSynthesisUtterance(msgText);
    window.speechSynthesis.speak(msg);

    msg.onend = () => {
      setIsAnnouncementActive(false); // Deactivate after speech ends
    };
  };

  const stopAnnouncement = () => {
    window.speechSynthesis.cancel(); // Stop any ongoing announcements
    setIsAnnouncementActive(false);
  };

  const drawDetections = (detections, videoWidth, videoHeight) => {
    const ctx = canvasRef.current.getContext("2d");

    // Clear the previous drawings
    ctx.clearRect(0, 0, videoWidth, videoHeight);

    // Draw each detected object
    detections.forEach((item) => {
      const [x, y, width, height] = item.bbox;

      // Draw bounding box
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Draw label and confidence
      ctx.fillStyle = "#00FF00";
      ctx.font = "18px Arial";
      ctx.fillText(
        `${item.class} (${(item.score * 100).toFixed(1)}%)`,
        x,
        y > 10 ? y - 5 : 10
      );
    });
  };

  useEffect(() => {
    runCoco();

    const fetchDevices = async () => {
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
    };

    fetchDevices();

    // Automatically trigger the "Stop Announcement" button every 10 seconds
    const stopAnnouncementInterval = setInterval(() => {
      stopAnnouncement();
    }, 10000); // 10 seconds

    return () => {
      clearInterval(detectInterval); // Cleanup detection interval
      clearInterval(stopAnnouncementInterval); // Cleanup stop announcement interval
    };
  }, []);

  return (
    <div className="flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold">Object Detection</h1>
      {loading ? (
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
                onClick={() => setCurrentDeviceId(device.deviceId)}
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
                  videoConstraints={{ deviceId: currentDeviceId }}
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
