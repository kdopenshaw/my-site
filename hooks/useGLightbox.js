// hooks/useGLightbox.js
import { useEffect } from "react";
import "glightbox/dist/css/glightbox.css";

export function useGLightbox(deps = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    import("glightbox").then(({ default: GLightbox }) => {
      const lightbox = GLightbox({
        selector: ".glightbox",
        descPosition: "right", // ✅ force description panel on the right
      });

      return () => {
        lightbox.destroy();
      };
    });
  }, deps);
}
