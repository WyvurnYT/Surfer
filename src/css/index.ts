import postCSS from "./postCSS.html";
import { minify } from "csso";

export default function(content: string): string {
    return minify(content + "\n" + postCSS).css;
}