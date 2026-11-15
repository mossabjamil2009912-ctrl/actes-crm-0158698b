import { useEffect, useRef, useState } from "react";

// Renders every PDF page as an image so phones (no built-in PDF frame viewer) show it inline.
export function PdfView({ url }: { url: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const doc = await pdfjs.getDocument({ url }).promise;
        const el = box.current;
        if (!el || dead) return;
        el.innerHTML = "";
        const w = el.clientWidth || 360;
        for (let i = 1; i <= doc.numPages && !dead; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = (w / base.width) * Math.min(window.devicePixelRatio || 1, 2.5);
          const vp = page.getViewport({ scale });
          const c = document.createElement("canvas");
          c.width = vp.width; c.height = vp.height;
          c.style.cssText = "width:100%;height:auto;display:block;margin-bottom:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2)";
          el.appendChild(c);
          await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
        }
      } catch (e) { if (!dead) setErr((e as Error).message); }
    })();
    return () => { dead = true; };
  }, [url]);
  return (
    <div className="min-h-0 w-full flex-1 overflow-auto bg-muted p-2">
      {err ? <p className="p-4 text-center text-sm text-destructive">تعذر عرض التقرير: {err}</p> : null}
      <div ref={box}><p className="p-6 text-center text-sm text-muted-foreground">جارٍ تحميل التقرير...</p></div>
    </div>
  );
}
