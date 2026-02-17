"use client";

import { getSandpackCssText } from "@codesandbox/sandpack-react";
import { useEffect } from "react";

export default function SandpackStyleInjector() {
  useEffect(() => {
    try {
      // Check if getSandpackCssText is available and callable
      if (typeof getSandpackCssText !== 'function') {
        console.warn('getSandpackCssText is not available');
        return;
      }

      const id = "onechat-sandpack-css";
      if (document.getElementById(id)) return;

      const cssText = getSandpackCssText();
      if (!cssText) return;

      const style = document.createElement("style");
      style.id = id;
      style.textContent = cssText;
      document.head.appendChild(style);

      return () => {
        try {
          style.remove();
        } catch {
          // ignore
        }
      };
    } catch (error) {
      console.warn('Failed to inject Sandpack CSS:', error);
      // ignore
    }
  }, []);

  return null;
}
