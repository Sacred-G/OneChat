"use client";

import { getSandpackCssText } from "@codesandbox/sandpack-react";
import { useEffect } from "react";

export default function SandpackStyleInjector() {
  useEffect(() => {
    try {
      const id = "onechat-sandpack-css";
      if (document.getElementById(id)) return;

      const style = document.createElement("style");
      style.id = id;
      style.textContent = getSandpackCssText();
      document.head.appendChild(style);

      return () => {
        try {
          style.remove();
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }
  }, []);

  return null;
}
