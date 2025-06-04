import { parse, serialize } from "cookie";

const HIDDEN_ELEMENTS_CSS = `
.rhnewtab-oldui-container-357674,
.rhnewtab-discord-532247,
.rhnewtab-header-ad-793410,
.rhnewtab-header-268997,
div[title="Click to open AB cloaked. Ctrl+click to open full url."] {
  display: none !important;
}
`;

const WELCOME_MSG =
  "🏄 Welcome to Surfer Browser! 🏄\n\n\n\n\n\n\n\n\n\n\n\nDue to limitations of the browser, some links may not work.";

const injectWelcomeMsgScript = `
(function() {
  function updateMsg() {
    var el = document.querySelector(".rhnewtab-msg-40821");
    if (el && el.innerText !== ${JSON.stringify(WELCOME_MSG)}) {
      el.innerText = ${JSON.stringify(WELCOME_MSG)};
    }
  }
  updateMsg();
  var observer = new MutationObserver(updateMsg);
  observer.observe(document.body, { childList: true, subtree: true });
})();
`;

const getPatchedCSS = async (fileReq: Response): Promise<string> => {
  const originalCSS = await fileReq.text();
  return HIDDEN_ELEMENTS_CSS + originalCSS;
};

const getPatchedJS = async (fileReq: Response): Promise<string> => {
  let js = await fileReq.text();
  // Replace Google search with Brave search
  js = js.replace(
    "https://www.google.com/search?q=",
    "https://search.brave.com/search?q="
  );
  // Replace all rh://welcome/ with https://search.brave.com
  js = js.replace(/rh:\/\/welcome\//g, "https://search.brave.com");
  // Append welcome message injection script
  return js + injectWelcomeMsgScript;
};

const commonHeaders = (type: string) => ({
  "Access-Control-Allow-Origin": "*",
  "Content-Type": type,
  "Cache-Control": "no-transform",
  "ETag": crypto.randomUUID().replace(/-/g, ""),
  "Set-Cookie": serialize("__BRH_ACCESS", "i_am_using_better_rh", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: true
  })
});

export default {
  async fetch(request, env, ctx): Promise<Response> {
    ctx.passThroughOnException();
    const req = new Request(request);
    const url = new URL(req.url);

    const isCSS = url.pathname.endsWith(".css");
    const isJS = url.pathname.endsWith(".js");

    const proxiedUrl = url.href.replace(url.hostname, "direct.rammerhead.org");
    const fileReq = await fetch(proxiedUrl, {
      method: req.method,
      headers: {
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Cache-Control": "no-cache",
        Dnt: "1",
        Pragma: "no-cache",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
      }
    });

    if (isCSS) {
      const patchedCSS = await getPatchedCSS(fileReq);
      return new Response(patchedCSS, {
        headers: commonHeaders("text/css")
      });
    }

    if (isJS) {
      const patchedJS = await getPatchedJS(fileReq);
      return new Response(patchedJS, {
        headers: commonHeaders("application/javascript")
      });
    }

    return new Response("Malformed", {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-transform",
        "ETag": crypto.randomUUID().replace(/-/g, "")
      }
    });
  }
} satisfies ExportedHandler<Env>;
