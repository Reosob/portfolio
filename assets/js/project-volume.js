(function () {
  const STORAGE_KEY = "portfolio.projectsVolume";
  const DEFAULT_VOLUME = 0.35;
  const UPDATE_INTERVAL_MS = 500;

  function clampVolume(value) {
    if (!Number.isFinite(value)) {
      return DEFAULT_VOLUME;
    }

    return Math.min(Math.max(value, 0), 1);
  }

  function readVolume() {
    try {
      const savedValue = window.localStorage.getItem(STORAGE_KEY);

      if (savedValue === null) {
        return DEFAULT_VOLUME;
      }

      return clampVolume(Number(savedValue));
    } catch (error) {
      return DEFAULT_VOLUME;
    }
  }

  function getVolume() {
    return readVolume();
  }

  function applyMediaVolume(root, volume) {
    if (!root || typeof root.querySelectorAll !== "function") {
      return;
    }

    root.querySelectorAll("audio, video").forEach((element) => {
      try {
        element.volume = volume;
      } catch (error) {
        // Ignore media elements that do not allow volume updates.
      }
    });
  }

  function patchAudioConstructor() {
    if (typeof window.Audio !== "function" || window.Audio.__portfolioVolumePatched) {
      return;
    }

    const OriginalAudio = window.Audio;

    function PatchedAudio(...args) {
      const audio = new OriginalAudio(...args);

      try {
        audio.volume = getVolume();
      } catch (error) {
        // Ignore browsers that block direct volume access here.
      }

      return audio;
    }

    PatchedAudio.prototype = OriginalAudio.prototype;
    Object.setPrototypeOf(PatchedAudio, OriginalAudio);
    Object.defineProperty(PatchedAudio, "__portfolioVolumePatched", {
      value: true
    });

    window.Audio = PatchedAudio;
  }

  function patchMediaPlayback() {
    const proto = window.HTMLMediaElement && window.HTMLMediaElement.prototype;

    if (!proto || proto.__portfolioVolumePatched) {
      return;
    }

    const originalPlay = proto.play;

    Object.defineProperty(proto, "__portfolioVolumePatched", {
      value: true
    });

    proto.play = function play(...args) {
      try {
        this.volume = getVolume();
      } catch (error) {
        // Ignore media elements that cannot be updated.
      }

      return originalPlay.apply(this, args);
    };
  }

  function patchUserSettings() {
    let currentValue = window.userSetting;

    const applyMuteFlag = (value) => {
      if (!value || typeof value !== "object") {
        return value;
      }

      value.isMuted = getVolume() === 0;
      return value;
    };

    currentValue = applyMuteFlag(currentValue);

    Object.defineProperty(window, "userSetting", {
      configurable: true,
      enumerable: true,
      get() {
        return currentValue;
      },
      set(nextValue) {
        currentValue = applyMuteFlag(nextValue);
      }
    });
  }

  function patchCocosAudioEngine() {
    const audioEngine = window.cc && window.cc.audioEngine;

    if (!audioEngine || audioEngine.__portfolioVolumePatched) {
      return audioEngine;
    }

    ["setMusicVolume", "setEffectsVolume"].forEach((methodName) => {
      const originalMethod = audioEngine[methodName];

      if (typeof originalMethod !== "function") {
        return;
      }

      audioEngine[methodName] = function patchedVolume(value, ...args) {
        const nextValue = typeof value === "number" ? clampVolume(value) : 1;
        return originalMethod.call(this, nextValue * getVolume(), ...args);
      };
    });

    Object.defineProperty(audioEngine, "__portfolioVolumePatched", {
      value: true
    });

    return audioEngine;
  }

  function applyCocosVolume() {
    const audioEngine = patchCocosAudioEngine();

    if (!audioEngine) {
      return;
    }

    if (typeof audioEngine.setMusicVolume === "function") {
      audioEngine.setMusicVolume(1);
    }

    if (typeof audioEngine.setEffectsVolume === "function") {
      audioEngine.setEffectsVolume(1);
    }
  }

  function applyHowlerVolume() {
    if (window.Howler && typeof window.Howler.volume === "function") {
      window.Howler.volume(getVolume());
    }
  }

  function syncVolume() {
    const volume = getVolume();

    applyMediaVolume(document, volume);
    applyCocosVolume();
    applyHowlerVolume();
  }

  function observeNewMedia() {
    if (!window.MutationObserver || !document.documentElement) {
      return;
    }

    const observer = new MutationObserver((mutations) => {
      const volume = getVolume();

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) {
            return;
          }

          if (node.matches && node.matches("audio, video")) {
            try {
              node.volume = volume;
            } catch (error) {
              // Ignore media elements that do not allow volume updates.
            }
          }

          applyMediaVolume(node, volume);
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  patchAudioConstructor();
  patchMediaPlayback();
  patchUserSettings();
  syncVolume();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      syncVolume();
      observeNewMedia();
    });
  } else {
    observeNewMedia();
  }

  window.addEventListener("load", syncVolume);
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key === STORAGE_KEY) {
      syncVolume();
    }
  });

  window.setInterval(syncVolume, UPDATE_INTERVAL_MS);
})();
