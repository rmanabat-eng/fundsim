"use client";

// Per the Next.js "Preventing Flash" guide: the script must execute during HTML
// parsing (server render), but React warns in development when client renders
// produce <script> tags — so the client renders it inert as text/plain.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
