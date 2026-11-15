import { useEffect, useRef, useState } from "react";
import { RotateCw, ZoomIn, ZoomOut } from "lucide-react";

// Renders every PDF page as a sharp image so phones show it inline.
// Wide pages (like the SLD) turn sideways on portrait phones to fill the screen; zoom stays crisp.
export function PdfView({ url }: { url: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [rotate, setRotate] = useState<boolean | null>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const doc = await pdfjs.getDocument({ url, standardFontDataUrl: "/pdf-fonts/", useSystemFonts: false }).promise;
        const el = box.current;
        if (!el || dead) return;
        const first = (await doc.getPage(1)).getViewport({ scale: 1 });
        const portraitScreen = window.innerHeight > window.innerWidth;
        const turn = rotate ?? (first.width > first.height * 1.3 && portraitScreen);
        if (rotate === null) { setRotate(turn); return; }
        el.innerHTML = "";
        for (let i = 1; i <= doc.numPages && !dead; i++) {
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1, rotation: turn ? 90 : 0 });
          // Render at ~3000px wide (capped) so zooming in keeps lines and text sharp.
          const scale = Math.min(4, Math.max(2, 3000 / base.width));
          const vp = page.getViewport({ scale, rotation: turn ? 90 : 0 });
          const c = document.createElement("canvas");
          c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
          c.style.cssText = "width:100%;height:auto;display:block;margin-bottom:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2)";
          el.appendChild(c);
          await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
        }
      } catch (e) { if (!dead) setErr((e as Error).message); }
    })();
    return () => { dead = true; };
  }, [url, rotate]);
  const btn = "flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground shadow border border-border";
  return (
    <div className="relative min-h-0 w-full flex-1 overflow-auto bg-muted p-2" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
      <div className="sticky top-0 z-10 flex justify-end gap-2 pb-2" dir="ltr">
        <button type="button" aria-label="تصغير" className={btn} onClick={() => setZoom((z) => Math.max(1, z - 0.5))}><ZoomOut className="h-4 w-4" /></button>
        <button type="button" aria-label="تكبير" className={btn} onClick={() => setZoom((z) => Math.min(4, z + 0.5))}><ZoomIn className="h-4 w-4" /></button>
        <button type="button" aria-label="عرض أفقي" className={btn} onClick={() => setRotate((r) => !r)}><RotateCw className="h-4 w-4" /></button>
      </div>
      {err ? <p className="p-4 text-center text-sm text-destructive">تعذر عرض التقرير: {err}</p> : null}
      <div ref={box} style={{ width: `${zoom * 100}%` }}><p className="p-6 text-center text-sm text-muted-foreground">جارٍ تحميل التقرير...</p></div>
    </div>
  );
}
