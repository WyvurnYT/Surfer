import { parse, serialize } from "cookie";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

const COMMON_HEADERS = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Cache-Control": "no-cache",
  Dnt: "1",
  Pragma: "no-cache",
  "User-Agent": USER_AGENT,
};

const COOKIE_NAME = "__BRH_ACCESS";
const COOKIE_VALUE = "i_am_using_better_rh";

const createCookieHeader = () =>
  serialize(COOKIE_NAME, COOKIE_VALUE, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: true,
  });

const generateETag = () => crypto.randomUUID().replace(/-/g, "");

const cssInjection = `
[class^="rhnewtab-oldui-container-"],
[class^="rhnewtab-discord-"],
[class^="rhnewtab-header-ad-"],
div[title="Click to open AB cloaked. Ctrl+click to open full url."] {
  display: none !important;
}
`;

const jsInjection = `
(function () {
  const prefixes = [
    "rhnewtab-oldui-container-",
    "rhnewtab-discord-",
    "rhnewtab-header-ad-"
  ];
  const msgPrefix = "rhnewtab-msg-";

  function removeTargets() {
    const elements = document.querySelectorAll('[class]');
    elements.forEach(el => {
      el.classList.forEach(cls => {
        if (prefixes.some(prefix => cls.startsWith(prefix))) {
          el.remove();
        } else if (cls.startsWith(msgPrefix)) {
          el.textContent = "Note: Due to platform limitations, some links may not function properly.";
        }
      });
    });

    document.querySelectorAll('div[title="Click to open AB cloaked. Ctrl+click to open full url."]').forEach(el => {
      el.remove();
    });
  }

  removeTargets();

  const observer = new MutationObserver(() => {
    observer.disconnect();
    removeTargets();
    observer.observe(document.body, { childList: true, subtree: true });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
`;

export default {
  async fetch(request, env, ctx): Promise<Response> {
    ctx.passThroughOnException();

    const req = new Request(request);
    const url = new URL(req.url);
    const pathname = url.href;
    const isCSS = pathname.endsWith(".css");
    const isJS = pathname.endsWith(".js");

    const proxiedUrl = pathname.replace(url.hostname, "direct.rammerhead.org");
    const fileResponse = await fetch(proxiedUrl, {
      method: req.method,
      headers: COMMON_HEADERS,
    });

    if (isCSS) {
      const originalCSS = await fileResponse.text();
      const patchedCSS = cssInjection + originalCSS;

      return new Response(patchedCSS, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/css",
          "Cache-Control": "no-transform",
          ETag: generateETag(),
          "Set-Cookie": createCookieHeader(),
        },
      });
    }

    if (isJS) {
      let originalJS = await fileResponse.text();
      originalJS = originalJS.split(`https://www.google.com/search?q=`).join(`https://search.brave.com/search?q=`);
      const finalJS = originalJS + jsInjection;

      return new Response(finalJS, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/javascript",
          "Cache-Control": "no-transform",
          ETag: generateETag(),
          "Set-Cookie": createCookieHeader(),
        },
      });
    }

    return new Response("Malformed", {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-transform",
        ETag: generateETag(),
      },
    });
  },
} satisfies ExportedHandler<Env>;
