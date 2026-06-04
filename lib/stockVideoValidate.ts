const PROBE_TIMEOUT_MS = 10_000;

/**
 * Check whether the browser can decode a remote MP4 before passing it to Remotion.
 */
export function probeVideoDecodable(url: string): Promise<boolean> {
  if (typeof document === "undefined") return Promise.resolve(true);

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(ok);
    };

    const timer = setTimeout(() => finish(false), PROBE_TIMEOUT_MS);

    video.onloadeddata = () => finish(true);
    video.onerror = () => finish(false);
    video.src = url;
  });
}

export function stripUnsafeVideoUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/-sd_\d+_\d+/.test(url)) return undefined;
  if (/426_240|640_360/.test(url)) return undefined;
  return url;
}
