import "server-only";
import sanitizeHtml from "sanitize-html";

// Email-safe styles applied to the composer's HTML (email clients ignore <style> blocks).
const SANS = "'Source Sans 3','Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const STYLE: Record<string, string> = {
  p: "margin:0 0 16px;",
  h2: `margin:24px 0 10px;font:700 26px/1.2 ${SERIF};color:#0b1a2e;`,
  h3: `margin:20px 0 8px;font:600 18px/1.3 ${SANS};color:#0b1a2e;`,
  ul: "margin:0 0 16px;padding-left:22px;",
  ol: "margin:0 0 16px;padding-left:22px;",
  li: "margin:0 0 6px;",
  blockquote: "margin:0 0 16px;padding:14px 18px;background:#f7f4ee;border-radius:14px;color:#142033;",
  a: "color:#0b1a2e;text-decoration:underline;",
  hr: "border:0;height:1px;background:#e5ddcc;margin:24px 0;",
};

/** Cleans composer HTML down to a safe, email-friendly subset and inlines styles. */
export function sanitizeEmailHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "h2", "h3", "ul", "ol", "li", "blockquote", "hr"],
    // style is only kept on tags we style ourselves — and transformTags overwrites any incoming value.
    allowedAttributes: {
      ...Object.fromEntries(Object.keys(STYLE).map((tag) => [tag, ["style"]])),
      a: ["href", "target", "rel", "style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      ...Object.fromEntries(
        Object.entries(STYLE).map(([tag, style]) => [
          tag,
          (tagName: string, attribs: Record<string, string>) => ({
            tagName,
            attribs: { ...attribs, style, ...(tag === "a" ? { target: "_blank", rel: "noopener noreferrer" } : {}) },
          }),
        ]),
      ),
      b: "strong",
      i: "em",
    },
    // Only the properties our own STYLE map uses (incoming values are overwritten anyway).
    allowedStyles: {
      "*": Object.fromEntries(
        ["margin", "padding", "padding-left", "font", "color", "background", "border-radius", "text-decoration", "border", "height"].map((prop) => [prop, [/^[^;<>]*$/]]),
      ),
    },
  });
}

export function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h2|h3|li|blockquote)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
