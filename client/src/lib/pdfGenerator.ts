import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { BirdWithSeenStatus } from '@shared/schema';

const GREEN = '#159d51';
const GREEN_LIGHT = '#e8f5ee';
const GREEN_BORDER = '#a8d5b8';
const BLUE_LIGHT = '#e8f4fc';
const BLUE_BORDER = '#9ed0e8';
const GRAY_TEXT = '#555';
const GRAY_LIGHT = '#f7f7f7';

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

const badge = (emoji: string, text: string, bg: string, border: string, color: string) => {
  const el = document.createElement('span');
  Object.assign(el.style, {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    background: bg,
    border: `1px solid ${border}`,
    color,
    fontSize: '10px',
    fontWeight: '500',
    padding: '2px 8px',
    borderRadius: '999px',
    fontFamily: 'Arial, sans-serif',
    whiteSpace: 'nowrap',
    lineHeight: '1.4',
    verticalAlign: 'middle',
  });
  const emojiSpan = document.createElement('span');
  emojiSpan.textContent = emoji;
  Object.assign(emojiSpan.style, { fontSize: '11px', lineHeight: '1', verticalAlign: 'middle' });
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  Object.assign(textSpan.style, { verticalAlign: 'middle', lineHeight: '1.4' });
  el.appendChild(emojiSpan);
  el.appendChild(textSpan);
  return el;
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
  hsubtitle.textContent = `${seenBirds.length} ${seenBirds.length === 1 ? 'espécie registrada' : 'espécies registradas'} · ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  Object.assign(hsubtitle.style, {
    margin: '0',
    fontSize: '14px',
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

  for (const bird of seenBirds) {
    const card = document.createElement('div');
    Object.assign(card.style, {
      border: `1px solid ${GREEN_BORDER}`,
      borderRadius: '10px',
      padding: '0',
      display: 'flex',
      gap: '0',
      background: 'white',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
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
      margin: '0 0 8px',
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
        margin: '6px 0 4px',
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
    await new Promise(resolve => setTimeout(resolve, 800));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    let heightLeft = imgHeight - 297;
    let pageOffset = -297;
    while (heightLeft > 0) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, pageOffset, imgWidth, imgHeight);
      pageOffset -= 297;
      heightLeft -= 297;
    }

    pdf.save(`aves-vistas-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Erro ao gerar o PDF:', error);
    alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
  } finally {
    if (container.parentNode) document.body.removeChild(container);
  }
};
