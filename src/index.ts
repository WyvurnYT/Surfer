/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import {
  parse,
  serialize
} from "cookie";

export default {
  async fetch(request, env, ctx): Promise<Response> {
    ctx.passThroughOnException();
    const req = new Request(request);
    const url = new URL(req.url);
    const cookies = parse(req.headers.get("Cookie") || "");
    const isCSS = url.href.includes(".css");
    const isJS = url.href.includes(".js");
    const fileReq = await fetch(url.href.replace(url.hostname, "direct.rammerhead.org"), {
      method: req.method,
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Cache-Control": "no-cache",
        "Dnt": "1",
        "Pragma": "no-cache",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
      }
    });
    if (isCSS) {
      const _fileContents = (await fileReq.text());
      // Inject CSS to hide elements with dynamic classnames (prefix-based)
      const patchedCSS = `
[class^="rhnewtab-oldui-container-"],
[class^="rhnewtab-discord-"],
[class^="rhnewtab-header-ad-"],
[class^="rhnewtab-header-"],
div[title="Click to open AB cloaked. Ctrl+click to open full url."] {
  display: none !important;
}
` + _fileContents;

      return new Response(patchedCSS, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/css",
          "Cache-Control": "no-transform",
          "ETag": crypto.randomUUID().split("-").join(""),
          "Set-Cookie": serialize("__BRH_ACCESS", "i_am_using_better_rh", {
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: true
          })
        }
      });
    } else if (isJS) {
      const _fileContents = await fileReq.text();
      // Inject JS to remove elements with classnames starting with given prefixes
      const injectScript = `
(function() {
  // Prefixes of classes to remove
  const prefixes = [
    "rhnewtab-oldui-container-",
    "rhnewtab-discord-",
    "rhnewtab-header-ad-",
    "rhnewtab-header-"
  ];

  // Prefix to set text
  const msgPrefix = "rhnewtab-msg-";

  function patchTargets() {
    let changedAny = false;
    // Remove elements with unwanted prefixes
    document.querySelectorAll('[class]').forEach(el => {
      for (const prefix of prefixes) {
        for (const cls of el.classList) {
          if (cls.startsWith(prefix)) {
            el.remove();
            changedAny = true;
            return;
          }
        }
      }
      // Set .textContent to "Aloha" for classes starting with rhnewtab-msg-
      for (const cls of el.classList) {
        if (cls.startsWith(msgPrefix)) {
          el.textContent = "Aloha";
          changedAny = true;
        }
      }
    });
    // Remove the specific div by title as well
    document.querySelectorAll('div[title="Click to open AB cloaked. Ctrl+click to open full url."]').forEach(el => {
      el.remove();
      changedAny = true;
    });
    return changedAny;
  }

  // First attempt in case elements are already present
  patchTargets();

  // Observe DOM for dynamically added elements and patch them
  const observer = new MutationObserver(() => {
    patchTargets();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
`;
      const finalJS = _fileContents + injectScript;
      return new Response(finalJS, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/javascript",
          "Cache-Control": "no-transform",
          "ETag": crypto.randomUUID().split("-").join(""),
          "Set-Cookie": serialize("__BRH_ACCESS", "i_am_using_better_rh", {
            path: "/",
            httpOnly: true,
            secure: true,
            sameSite: true
          })
        },
      });
    } else {
      return new Response("Malformed", {
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-transform",
          "ETag": crypto.randomUUID().replace(/\-/gm, "")
        }
      })
    }
  },
}	satisfies ExportedHandler<Env>;
