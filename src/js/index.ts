import preScript from "./preScript.html";
import postScript from "./postScript.html";
// @ts-ignore
import strip from "strip-comments";
import { minify } from "terser";

export default async function(content: string, privateProtocol: string = "rh"): Promise<string> {
    // content = strip(content);
    const classNames = JSON.stringify((content.match(/className\:\s*\"+[^,\}\+]+/gmi) || []).map(e => e.slice(10)).filter(e => (e!=="\"class\"")).map(e => JSON.parse(e).split(" ").join(",")).join(",").split(",").reduce((prev, curr, idx) => {
        // @ts-ignore
        if (prev.includes(curr)) return prev;
        // @ts-ignore
        else { prev.push(curr); return prev; }
    // @ts-ignore
    }, []).map(e => ([e.match(/[^0-9]+/gmi)[0].replace("--", "-") || "", e])).map(e => (e[0].endsWith("-")? [e[0].slice(0, -1), e[1]] : e)).map(e => [e[0].split("-").map((e, i) => {
        if (i > 0) {
            return e.slice(0, 1).toUpperCase() + e.slice(1);
        } else {
            return e;
        }
    }).join(""),e[1]]).reduce((prev, curr) => {
        
        // @ts-ignore
        if (prev[curr[0]]) {
            // @ts-ignore
            prev[curr[0]] += (" " + curr[1]);
            return prev;
        } else {
            // @ts-ignore
            prev[curr[0]] = curr[1];
            return prev;
        }
    }, {}));
    // @ts-ignore
    const requireFunc = content.match(/=[a-z0-9]{1,3}\(\d+\)/gm).map(e => e.replace("=", "").split("(")[0]).slice(-1)[0];
    return (await minify(preScript)).code + content.replace(/[a-z]\.version="\d+\.\d+\.\d+"\}/gmi, function(match) {
        const reactKey = match.split(".")[0];
        return ("window?._getCorrectReact?.\(" + reactKey + "\)," + match);
    }).replace(/[a-z]\.jsxs=[a-z]/gmi, function(match) {
        const jsxKey = match.split(".")[0];
        return (match + ";window?._getCorrectJSX?.\(" + jsxKey + "\);");
    }).replace(/[a-z0-9]{1,3}=\[\{host\:".*\}\]\;/gmi, function(match) {
        const pagesKey = match.split("=")[0];
        return (match + "window?._getCorrectPages?.\(" + pagesKey + "\);");
    }).replace(/!function\(\)\{var [a-z0-9]{1,3}=\{/gmi, function(match) {
        const moduleStore = match.slice(0, -2).split(" ").slice(-1)[0];
        return match + ("\"brb\":function(mod,exp,req){mod.exports=exp={require:req,store:"+moduleStore+"};},")
    }).replace(/document.getElementById\("root"\)\)[^;]+/gmi, function(match) {
        const first = match.slice(0, -3);
        const last = match.slice(-3);
        return (first + `;window?._handleRequire(${requireFunc}("brb"));` + last);
    }).replace(/\"rh:/gm, function(match) {
        return `(window?.BetterRH?.privateProtocol||\"rh\")+\":`;
    }).replace(/\/\^rh[^\/]*\/[^,]*/gm, function(match) {
        return `RegExp(\`\${window?.BetterRH?.privateProtocol||\"rh\"}\`)`;
    }).replace(/window.rhSession=[a-z0-9]{1,3}\;[^=]+/, function(match) {
        return (match + `=window.BetterRH["~execQuery"]`);
    }).replace(/onError:[^,]+,/gm, function(match) {
        const [fnName, action] = match.split(":");
        if (action === "null," || action === "\"onerror\",") return match;
        else {
            if (action.startsWith("function")) {
                // Function call
                const [fnParams, script] = action.split("{");
                const errorParam = fnParams.split("(")[1].slice(0, -1);
                return (fnParams+`{window?.BetterRH?.Logs?.pushMessage(${errorParam});${script}`);
            } else {
                return (fnName+":"+"function(...q){window?.BetterRH?.Logs?.pushMessage(...q);"+action.slice(0, -1)+".call(this, ...q);},");
            }
        }
    }).replace(/onerror=[^f],*/gm, function(match) {
        const [eventName, handleFn] = match.split("=");
        const ending = (handleFn.endsWith(",")? "," : "");
        const fnName = (ending === ",")? handleFn.slice(0, -1) : handleFn;
        return (eventName + "=" + `function(...q){window?.BetterRH?.Logs?.pushMessage(...q);${fnName}.call(this, ...q)}${ending}`);
    }).replace(/[a-z]{1}\.[a-z0-9]{1,3}\=[a-z]{1,2}\.catch\([^),;]\)/gm, function(match) {
        return "window?.BetterRH?.Logs?.pushMessage("+match+")";
    }).replace("/logo.png", "https://settings.lhost.dev/assets/BetterRHLogo.png") + "\n" + (await minify(postScript+"\n;window._defineClasses(\`"+classNames+"\`)")).code;
}