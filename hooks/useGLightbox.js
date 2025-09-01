import { useEffect } from "react";
import "glightbox/dist/css/glightbox.css";
import "plyr/dist/plyr.css";

/**
 * Initialize GLightbox. Re-inits when deps change.
 * Ensures Plyr is loaded locally (no CDN) and exposed as window.Plyr.
 */
export function useGLightbox(deps = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lightbox;

    (async () => {
      try {
        // 1) Ensure Plyr (JS) is available globally
        if (!window.Plyr) {
          const PlyrModule = await import("plyr");
          window.Plyr = PlyrModule.default || PlyrModule;
          console.log("[useGLightbox] Plyr loaded:", typeof window.Plyr);
        }

        // 2) Load GLightbox and init
        const { default: GLightbox } = await import("glightbox");

        lightbox = GLightbox({
          selector: ".glightbox",
          descPosition: "right",

          // FIX: Completely disable Plyr's problematic features
          plyr: {
            css: "", // No external CSS
            js: "", // No external JS
            config: {
              // Disable all network-dependent features
              captions: {
                active: false,
                update: false,
                language: "auto",
              },

              // Disable subtitle/track fetching
              tracks: [],

              // Disable poster image fetching
              poster: "",

              // Disable thumbnail previews
              previewThumbnails: {
                enabled: false,
              },

              // Disable markers
              markers: {
                enabled: false,
              },

              // Disable ads (can make network requests)
              ads: {
                enabled: false,
                publisherId: "",
                tagUrl: "",
              },

              // Disable analytics
              analytics: {
                enabled: false,
              },

              // Disable fullscreen API calls that might trigger requests
              fullscreen: {
                enabled: true,
                fallback: true,
                iosNative: false,
              },

              // Keep controls minimal to avoid network requests
              controls: [
                "play-large",
                "play",
                "progress",
                "current-time",
                "mute",
                "volume",
                "fullscreen",
              ],

              // Disable settings menu (can cause issues)
              settings: [],

              // Disable keyboard shortcuts that might trigger network calls
              keyboard: { focused: true, global: false },

              // Disable tooltips that might fetch content
              tooltips: { controls: false, seek: true },

              // Disable quality selector
              quality: {
                default: 720,
                options: [],
              },

              // Disable speed controls
              speed: {
                selected: 1,
                options: [],
              },

              // Disable loop
              loop: { active: false },

              // Disable autoplay
              autoplay: false,

              // Disable click to play
              clickToPlay: true,

              // Disable double click for fullscreen
              dblClickFullscreen: false,

              // Set volume
              volume: 1,
              muted: false,

              // Disable seeking
              seekTime: 10,

              // Disable storage (localStorage/sessionStorage)
              storage: { enabled: false },

              // Disable cross-origin
              crossorigin: null,

              // Change preload to metadata so thumbnails work
              preload: "metadata",
            },
          },

          openEffect: "zoom",
          closeEffect: "zoom",

          // Enhanced error handling
          onOpen: () => {
            console.log("[GLB] onOpen");
            // Disable any potential network requests on open
            try {
              const videos = document.querySelectorAll(
                ".plyr video, .plyr audio"
              );
              videos.forEach((video) => {
                video.preload = "none";
                video.crossOrigin = null;
              });
            } catch (e) {
              console.warn("Could not configure video elements:", e);
            }
          },

          onSlideChanged: ({ slide }) => {
            const node = slide?.slideNode;
            console.log("[GLB] onSlideChanged", {
              isVideo: slide?.player ? true : false,
              src: node
                ?.querySelector("video, iframe, img")
                ?.getAttribute("src"),
              typeAttr: node?.dataset?.type,
            });

            // Additional safety for video elements
            try {
              const video = node?.querySelector("video");
              if (video) {
                video.preload = "none";
                video.crossOrigin = null;
              }
            } catch (e) {
              console.warn("Could not configure video in slide:", e);
            }
          },

          onClose: () => console.log("[GLB] onClose"),

          // Add error handler
          onError: (error) => {
            console.error("[GLB] Error occurred:", error);
          },
        });

        // Global error handler for any XMLHttpRequest errors
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function () {
          const xhr = new originalXHR();
          const originalOpen = xhr.open;

          xhr.open = function (method, url, ...args) {
            // Block any suspicious requests that might be from Plyr
            if (
              url &&
              (url.includes("vtt") ||
                url.includes("subtitle") ||
                url.includes("caption") ||
                url.includes("track") ||
                url.includes("ads") ||
                url.includes("analytics"))
            ) {
              console.warn(
                `[useGLightbox] Blocked potentially problematic request to: ${url}`
              );
              return;
            }
            return originalOpen.apply(this, [method, url, ...args]);
          };

          return xhr;
        };
      } catch (e) {
        console.error("[useGLightbox] init failed:", e);
      }
    })();

    return () => {
      // Restore original XMLHttpRequest
      if (window.XMLHttpRequest._original) {
        window.XMLHttpRequest = window.XMLHttpRequest._original;
      }

      if (lightbox) {
        try {
          lightbox.destroy();
        } catch (e) {
          console.warn("Error destroying lightbox:", e);
        }
      }
    };
  }, deps);
}
