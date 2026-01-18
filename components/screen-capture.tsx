"use client";

import React, { useState } from "react";
import { Monitor, Camera } from "lucide-react";
import useThemeStore from "@/stores/useThemeStore";

interface ScreenCaptureProps {
  onCapture: (imageData: string) => void;
}

const ScreenCapture: React.FC<ScreenCaptureProps> = ({ onCapture }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const { theme } = useThemeStore();

  const handleScreenCapture = async () => {
    try {
      setIsCapturing(true);

      // Use the Screen Capture API
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        } as MediaTrackConstraints,
        audio: false,
      });

      // Create video element to capture frame
      const video = document.createElement("video");
      video.srcObject = stream;
      video.play();

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Create canvas and capture frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Convert to base64
        const imageData = canvas.toDataURL("image/png");
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        
        // Send captured image
        onCapture(imageData);
      }

      setIsCapturing(false);
    } catch (error) {
      console.error("Error capturing screen:", error);
      setIsCapturing(false);
      
      // User cancelled or error occurred
      if (error instanceof Error && error.name !== "NotAllowedError") {
        alert("Failed to capture screen. Please try again.");
      }
    }
  };

  return (
    <button
      onClick={handleScreenCapture}
      disabled={isCapturing}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        theme === "dark"
          ? "bg-[#2f2f2f] hover:bg-[#3f3f3f] text-white border border-stone-600"
          : "bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Capture screen"
    >
      {isCapturing ? (
        <>
          <Camera size={16} className="animate-pulse" />
          Capturing...
        </>
      ) : (
        <>
          <Monitor size={16} />
          Share Screen
        </>
      )}
    </button>
  );
};

export default ScreenCapture;
