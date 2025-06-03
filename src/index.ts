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

import { parse, serialize } from "cookie";

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
  // Inject CSS to hide the specified elements
  const patchedCSS = `
.rhnewtab-oldui-container-357674,
.rhnewtab-discord-532247,
.rhnewtab-header-ad-793410,
.rhnewtab-header-268997,
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
  const _fileContents = (await fileReq.text());
  // PATCH: Replace Google search with Brave search
  let patchedContents = _fileContents.replace(
    "https://www.google.com/search?q=",
    "https://search.brave.com/search?q="
  );
  // PATCH: Replace all rh://welcome/ with https://search.brave.com
  patchedContents = patchedContents.replace(/rh:\/\/welcome\//g, "https://search.brave.com");

  // Inject robust JS to update the message text whenever it appears and to run i(Ve("https://search.brave.com")) in page context
const injectScript = `
(function() {
  let hasRun = false;
  function updateMsg() {
    var el = document.querySelector(".rhnewtab-msg-40821");
    if (el && el.innerText !== "🏄 Welcome to Surfer Browser! 🏄\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\nDue to limitations of the browser, some links may not work.") {
      el.innerText = "🏄 Welcome to Surfer Browser! 🏄\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\nDue to limitations of the browser, some links may not work.";
    }
    // Inject a script tag to run i(Ve("https://search.brave.com")) only once, 5 seconds after the first mutation
    if (!hasRun) {
      hasRun = true;
      setTimeout(function() {
        var script = document.createElement('script');
        script.textContent = \`
          try {
            i(Ve("https://search.brave.com"));
            console.log("Ran i(Ve('https://search.brave.com')) after mutation observer and 5 second delay");
          } catch (e) {
            console.error("Error running i(Ve()):", e);
          }
        \`;
        document.documentElement.appendChild(script);
        script.remove();
      }, 5000);
    }
  }
  // Initial check
  updateMsg();
  // Keep watching for changes in the body
  var observer = new MutationObserver(updateMsg);
  observer.observe(document.body, { childList: true, subtree: true });

  // --- NEW: Auto-open url from ?url= param on load ---
  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  try {
    const urlParam = getQueryParam("url");
    if (urlParam && typeof Ve === "function" && typeof i === "function") {
      // Use the exact same logic as the "Open in-browser" button
      i(Ve(urlParam));
    }
  } catch (e) {
    // Fail silently
  }
})();
`;
  const finalJS = patchedContents + injectScript;

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
} satisfies ExportedHandler<Env>;
