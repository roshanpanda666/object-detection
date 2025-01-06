"use client";
import React, { useState, useEffect } from "react";
import Webcam from "react-webcam";

const ObjectDetection = () => {
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);

  // Get available video input devices
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
      const videoDevices = mediaDevices.filter(
        (device) => device.kind === "videoinput"
      );
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setCurrentDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  return (
    <div className=" flex flex-col justify-center items-center">
      <h1>Object Detection</h1>
       {/* Camera Switcher */}
       <div className="mt-3">
          {devices.map((device, index) => (
            <button
              key={device.deviceId}
              className="p-2 m-2 bg-black text-white border-white border-2 hover:bg-white hover:text-black rounded"
              onClick={() => setCurrentDeviceId(device.deviceId)}
            >
              Camera {index + 1}
            </button>
          ))}
        </div>
      <div className="relative justify-center items-center">
        {/* Webcam Component */}
        {currentDeviceId && (
          <Webcam
            className="lg:h-[520px]"
            videoConstraints={{ deviceId: currentDeviceId }}
          />
        )}
       
      </div>
    </div>
  );
};

export default ObjectDetection;
