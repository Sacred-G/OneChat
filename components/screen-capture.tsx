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
      className={`inline-flex items-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors sm:gap-2 sm:px-3 sm:text-sm ${
        theme === "dark"
          ? "bg-white/[0.04] hover:bg-white/10 text-white border border-white/10"
          : "bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-300"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Capture screen"
    >
      {isCapturing ? (
        <>
          <Camera size={14} className="animate-pulse sm:size-16" />
          <span className="hidden sm:inline">Capturing...</span>
        </>
      ) : (
        <>
          <Monitor size={14} className="sm:size-16" />
          <span className="hidden sm:inline">Share Screen</span>
        </>
      )}
    </button>
  );
};

export default ScreenCapture;
