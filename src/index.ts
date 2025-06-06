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
		// ... (rest of your worker code remains unchanged)

} else if (isJS) {
  const _fileContents = await fileReq.text();
  // Inject JavaScript to remove specific elements once when they first appear
  const injectScript = `
(function() {
  // List of target selectors to remove
  const selectors = [
    '.rhnewtab-header-480641',
    '.rhnewtab-discord-435940',
    '.rhnewtab-oldui-container-947649'
  ];

  // Function to remove all elements matching selectors, returns true if any were removed
  function removeTargets() {
    let removedAny = false;
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.remove();
        removedAny = true;
      });
    });
    return removedAny;
  }

  // First attempt in case elements are already present
  if (removeTargets()) return;

  // Otherwise, observe DOM until all the elements are removed, then disconnect observer
  const observer = new MutationObserver(() => {
    if (removeTargets()) {
      observer.disconnect();
    }
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
} satisfies ExportedHandler<Env>;
