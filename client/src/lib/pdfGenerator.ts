import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { BirdWithSeenStatus } from '@shared/schema';

const GREEN = '#0f783a';
const GREEN_LIGHT = '#e8f5ee';
const GREEN_BORDER = '#a8d5b8';
const GRAY_TEXT = '#555';

const recordPdfGeneration = async (seenBirds: BirdWithSeenStatus[]) => {
  try {
    let latitude: number | null = null;
    let longitude: number | null = null;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 600000,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch {}
    }
    await fetch('/api/pdf-generated', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ birdCount: seenBirds.length, birdNames: seenBirds.map(b => b.name), latitude, longitude }),
      credentials: 'include',
    });
  } catch {}
};

const section = (label: string, value: string | null | undefined) => {
  if (!value) return null;
  const wrap = document.createElement('div');
  wrap.style.marginBottom = '4px';
  const lbl = document.createElement('span');
  lbl.textContent = label + ': ';
  Object.assign(lbl.style, { fontWeight: 'bold', fontSize: '10px', color: GREEN, fontFamily: 'Arial, sans-serif' });
  const val = document.createElement('span');
  val.textContent = value;
  Object.assign(val.style, { fontSize: '10px', color: GRAY_TEXT, fontFamily: 'Arial, sans-serif', lineHeight: '1.4' });
  wrap.appendChild(lbl);
  wrap.appendChild(val);
  return wrap;
};

const waitForImages = (container: HTMLElement): Promise<void> => {
  const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
  return Promise.all(
    imgs.map(img =>
      new Promise<void>(resolve => {
        if (img.complete && img.naturalWidth > 0) { resolve(); return; }
        img.onload = () => resolve();
        img.onerror = () => {
          img.style.display = 'none';
          resolve();
        };
      })
    )
  ).then(() => undefined);
};

export const generateBirdsPDF = async (seenBirds: BirdWithSeenStatus[]): Promise<void> => {
  if (seenBirds.length === 0) {
    alert('Você ainda não marcou nenhuma ave como vista!');
    return;
  }

  recordPdfGeneration(seenBirds);

  const container = document.createElement('div');
  Object.assign(container.style, {
    width: '820px',
    padding: '0',
    backgroundColor: 'white',
    position: 'absolute',
    left: '-9999px',
    top: '0',
    fontFamily: 'Arial, sans-serif',
  });
  document.body.appendChild(container);

  // ── Header ────────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  Object.assign(header.style, {
    background: 'white',
    borderBottom: `3px solid ${GREEN}`,
    padding: '28px 36px 22px',
    marginBottom: '24px',
  });

  const htitle = document.createElement('h1');
  htitle.textContent = 'As aves que vi na Cachoeira da Toca!';
  Object.assign(htitle.style, {
    fontFamily: 'Arial, sans-serif',
    fontSize: '26px',
    fontWeight: 'bold',
    margin: '0 0 6px',
    color: GREEN,
    letterSpacing: '0.5px',
  });

  const hsubtitle = document.createElement('p');
  hsubtitle.textContent = `Projeto Despertar para a Observação de Aves · ${seenBirds.length} ${seenBirds.length === 1 ? 'espécie registrada' : 'espécies registradas'} · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  Object.assign(hsubtitle.style, {
    margin: '0',
    fontSize: '13px',
    color: GRAY_TEXT,
    fontFamily: 'Arial, sans-serif',
  });

  header.appendChild(htitle);
  header.appendChild(hsubtitle);
  container.appendChild(header);

  // ── Grid ──────────────────────────────────────────────────────────────────
  const grid = document.createElement('div');
  Object.assign(grid.style, {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    padding: '0 24px 24px',
  });

  for (let i = 0; i < seenBirds.length; i++) {
    const bird = seenBirds[i];
    const card = document.createElement('div');
    card.dataset.cardIdx = String(i);
    Object.assign(card.style, {
      border: `1px solid ${GREEN_BORDER}`,
      borderRadius: '10px',
      padding: '0',
      display: 'flex',
      gap: '0',
      background: 'white',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    });

    // Square image
    const imgWrap = document.createElement('div');
    Object.assign(imgWrap.style, {
      width: '130px',
      height: '130px',
      flexShrink: '0',
      background: GREEN_LIGHT,
    });

    const img = document.createElement('img');
    const src = bird.customImageUrl || bird.imageUrl || '';
    img.src = src.startsWith('//') ? `https:${src}` : src;
    img.crossOrigin = 'anonymous';
    img.alt = bird.name;
    Object.assign(img.style, { width: '130px', height: '130px', objectFit: 'cover', display: 'block' });
    imgWrap.appendChild(img);

    // Info
    const info = document.createElement('div');
    Object.assign(info.style, { flex: '1', overflow: 'hidden', padding: '12px 14px' });

    const name = document.createElement('h2');
    name.textContent = bird.name;
    Object.assign(name.style, {
      margin: '0 0 2px',
      fontSize: '15px',
      fontWeight: 'bold',
      color: '#222',
      fontFamily: 'Arial, sans-serif',
    });

    const sciName = document.createElement('p');
    sciName.textContent = bird.scientificName;
    Object.assign(sciName.style, {
      margin: '0 0 6px',
      fontSize: '12px',
      fontStyle: 'italic',
      color: '#888',
      fontFamily: 'Arial, sans-serif',
    });

    info.appendChild(name);
    info.appendChild(sciName);

    if (bird.description) {
      const desc = document.createElement('p');
      desc.textContent = bird.description;
      Object.assign(desc.style, {
        fontSize: '10px',
        color: GRAY_TEXT,
        fontFamily: 'Arial, sans-serif',
        lineHeight: '1.5',
        margin: '0 0 4px',
      });
      info.appendChild(desc);
    }

    const s1 = section('Comportamento', bird.behavior);
    const s2 = section('Habitat', bird.habitat);
    const s3 = section('Dieta', bird.diet);
    if (s1) info.appendChild(s1);
    if (s2) info.appendChild(s2);
    if (s3) info.appendChild(s3);

    card.appendChild(imgWrap);
    card.appendChild(info);
    grid.appendChild(card);
  }

  container.appendChild(grid);

  // ── Footer ────────────────────────────────────────────────────────────────
  const footer = document.createElement('div');
  Object.assign(footer.style, {
    borderTop: `2px solid ${GREEN_BORDER}`,
    margin: '0 24px',
    padding: '12px 0',
    textAlign: 'center',
    fontSize: '11px',
    color: '#aaa',
    fontFamily: 'Arial, sans-serif',
  });
  footer.textContent = 'Cachoeira da Toca · tocabirds.com';
  container.appendChild(footer);

  try {
    // Wait for all images to load (not just a fixed delay)
    await waitForImages(container);

    // ── Measure positions for smart page breaks ────────────────────────────
    // A4 at 820px wide → page height in DOM px = 297/210 * 820 ≈ 1160px
    const PAGE_H_DOM = Math.round((297 / 210) * 820);
    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top;

    // Header height (repeated on every page)
    const headerDomH = Math.round(header.getBoundingClientRect().bottom - containerTop);

    // Bottom edge of every card row, relative to container top
    const cardEls = Array.from(grid.querySelectorAll('[data-card-idx]')) as HTMLElement[];
    const rowBottoms: number[] = [];
    for (let i = 0; i < cardEls.length; i += 2) {
      const a = cardEls[i].getBoundingClientRect();
      const b = cardEls[i + 1]?.getBoundingClientRect();
      const rowBottom = Math.max(a.bottom, b ? b.bottom : a.bottom) - containerTop;
      rowBottoms.push(rowBottom);
    }

    // cuts[] = DOM-px start positions (relative to container) for each page's content slice
    // Page 1 uses full PAGE_H_DOM; pages 2+ have headerDomH reserved at the top
    const cuts: number[] = [0];
    let currentPos = 0;
    let isFirst = true;

    while (true) {
      const availH = isFirst ? PAGE_H_DOM : PAGE_H_DOM - headerDomH;
      const pageEnd = currentPos + availH;
      let cutAt = currentPos;
      for (const rb of rowBottoms) {
        if (rb <= pageEnd) cutAt = rb;
      }
      const hasMore = rowBottoms.some(rb => rb > cutAt);
      if (!hasMore || cutAt <= currentPos) break;
      currentPos = cutAt + 8; // 8px gap between rows
      cuts.push(currentPos);
      isFirst = false;
    }

    // ── Render full canvas ─────────────────────────────────────────────────
    const SCALE = 2;
    const fullCanvas = await html2canvas(container, {
      scale: SCALE,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const pageWidthPx = fullCanvas.width;
    const headerPx = headerDomH * SCALE;

    // ── Build per-page canvases ────────────────────────────────────────────
    const pdf = new jsPDF('p', 'mm', 'a4');

    for (let p = 0; p < cuts.length; p++) {
      if (p > 0) pdf.addPage();

      const contentStartPx = cuts[p] * SCALE;
      const contentEndPx = p + 1 < cuts.length ? cuts[p + 1] * SCALE : fullCanvas.height;
      const contentH = contentEndPx - contentStartPx;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = pageWidthPx;

      const ctx = pageCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';

      if (p === 0) {
        // Page 1: content already includes the header naturally
        pageCanvas.height = contentH;
        ctx.fillRect(0, 0, pageWidthPx, contentH);
        ctx.drawImage(fullCanvas, 0, contentStartPx, pageWidthPx, contentH, 0, 0, pageWidthPx, contentH);
      } else {
        // Pages 2+: prepend header then content
        pageCanvas.height = headerPx + contentH;
        ctx.fillRect(0, 0, pageWidthPx, headerPx + contentH);
        // Draw header from full canvas
        ctx.drawImage(fullCanvas, 0, 0, pageWidthPx, headerPx, 0, 0, pageWidthPx, headerPx);
        // Draw content slice below
        ctx.drawImage(fullCanvas, 0, contentStartPx, pageWidthPx, contentH, 0, headerPx, pageWidthPx, contentH);
      }

      const imgData = pageCanvas.toDataURL('image/png');
      const sliceMmH = (pageCanvas.height / pageWidthPx) * 210;
      pdf.addImage(imgData, 'PNG', 0, 0, 210, sliceMmH);
    }

    pdf.save(`aves-vistas-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
  } finally {
    if (container.parentNode) document.body.removeChild(container);
  }
};
