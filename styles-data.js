/* Hairstyle lookbook — photos are free-licence inspiration images (Unsplash).
   To use your own work: put a photo in assets/looks/ and change "img" below. */
const U = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

window.LOOKS = [
  { id: 'low-fade',   name: 'Low Fade',          cat: 'fade',   hair: 'fade',   img: U('photo-1622286342621-4bd786c2447c'), size: 'tall' },
  { id: 'mid-fade',   name: 'Mid Fade',          cat: 'fade',   hair: 'fade2',  img: U('photo-1599351431202-1e0f0137899a') },
  { id: 'skin-fade',  name: 'High Skin Fade',    cat: 'fade',   hair: 'fade3',  img: U('photo-1621605815971-fbc98d665033') },
  { id: 'taper',      name: 'Taper Fade',        cat: 'fade',   hair: 'taper',  img: U('photo-1605497788044-5a32c7078486'), size: 'wide' },
  { id: 'burst',      name: 'Burst Fade',        cat: 'fade',   hair: 'burst',  img: U('photo-1593702288056-7927b442d0fa') },
  { id: 'waves',      name: '360 Waves',         cat: 'curly',  hair: 'waves',  img: U('photo-1618077360395-f3068be8e001'), size: 'tall' },
  { id: 'twists',     name: 'Twists',            cat: 'curly',  hair: 'twists', img: U('photo-1531384441138-2736e62e0919') },
  { id: 'afro',       name: 'Afro Shape-up',     cat: 'curly',  hair: 'afro',   img: U('photo-1522529599102-193c0d76b5b6') },
  { id: 'buzz',       name: 'Buzz Cut',          cat: 'short',  hair: 'buzz',   img: U('photo-1567894340315-735d7c361db0') },
  { id: 'crop',       name: 'Textured Crop',     cat: 'short',  hair: 'crop',   img: U('photo-1517832606299-7ae9b720a186'), size: 'wide' },
  { id: 'freestyle',  name: 'Freestyle Design',  cat: 'design', hair: 'design', img: U('photo-1512690459411-b9245aed614b') },
  { id: 'beard',      name: 'Beard Line-up',     cat: 'beard',  hair: 'beard',  img: U('photo-1621607512214-68297480165e') },
  { id: 'jt',         name: 'JT Signature',      cat: 'fade',   hair: 'fade',   img: 'assets/tiktok4.jpg' }
];

/* Illustrated fallback: a stylised head with the matching cut (shown if a photo can't load). */
window.hairSVG = function (type) {
  const skin = '#2a2a2a', hair = '#f5f3ef', red = '#e10600';
  const clip = `<clipPath id="h-${type}"><ellipse cx="100" cy="112" rx="50" ry="62"/></clipPath>`;
  const grad = (top, bottom) => `<linearGradient id="g-${type}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="${top}" stop-color="${hair}"/><stop offset="${bottom}" stop-color="${hair}" stop-opacity="0"/></linearGradient>`;
  let defs = clip, top = '', cap = '', extra = '';
  switch (type) {
    case 'fade':  defs += grad(.25, .62); cap = `<rect x="40" y="40" width="120" height="110" fill="url(#g-${type})"/>`; top = `<path d="M54 92 Q52 44 100 40 Q148 44 146 92 Q130 70 100 68 Q70 70 54 92z" fill="${hair}"/>`; break;
    case 'fade2': defs += grad(.2, .5);  cap = `<rect x="40" y="40" width="120" height="110" fill="url(#g-${type})"/>`; top = `<path d="M56 86 Q54 36 100 32 Q146 36 144 86 Q128 64 100 62 Q72 64 56 86z" fill="${hair}"/>`; break;
    case 'fade3': defs += grad(.15, .38); cap = `<rect x="40" y="40" width="120" height="110" fill="url(#g-${type})"/>`; top = `<path d="M62 76 Q62 26 100 22 Q138 26 138 76 Q122 58 100 56 Q78 58 62 76z" fill="${hair}"/>`; break;
    case 'taper': defs += grad(.4, .72); cap = `<rect x="40" y="40" width="120" height="110" fill="url(#g-${type})"/>`; top = `<path d="M50 96 Q46 40 100 34 Q154 40 150 96 Q132 72 100 70 Q68 72 50 96z" fill="${hair}"/>`; break;
    case 'burst': defs += grad(.3, .55); cap = `<rect x="40" y="40" width="120" height="110" fill="url(#g-${type})"/>`; top = `<path d="M58 80 C40 20 160 20 142 80 Q120 60 100 60 Q80 60 58 80z" fill="${hair}"/><path d="M50 110 Q40 140 60 150" stroke="${skin}" stroke-width="14" fill="none"/>`; break;
    case 'waves': cap = `<rect x="40" y="40" width="120" height="70" fill="${hair}" opacity=".9"/>` + [56, 68, 80, 92].map(y => `<path d="M48 ${y} q13 -8 26 0 t26 0 t26 0 t26 0" stroke="${skin}" stroke-width="3" fill="none"/>`).join(''); break;
    case 'twists': top = Array.from({ length: 9 }, (_, i) => `<rect x="${50 + i * 11}" y="${18 + Math.abs(4 - i) * 5}" width="9" height="${58 - Math.abs(4 - i) * 4}" rx="4.5" fill="${hair}"/>`).join(''); cap = `<rect x="40" y="40" width="120" height="56" fill="${hair}"/>`; break;
    case 'afro':  top = `<circle cx="100" cy="64" r="64" fill="${hair}"/>` + Array.from({ length: 22 }, (_, i) => { const a = i / 22 * Math.PI * 2; return `<circle cx="${100 + Math.cos(a) * 60}" cy="${64 + Math.sin(a) * 60}" r="9" fill="${hair}"/>`; }).join(''); break;
    case 'buzz':  cap = `<rect x="40" y="40" width="120" height="72" fill="${hair}" opacity=".55"/>`; break;
    case 'crop':  top = `<path d="M50 96 Q46 36 100 32 Q154 36 150 96 L150 78 Q100 62 50 82z" fill="${hair}"/><path d="M58 76 l8 10 l6 -10 l7 10 l6 -10 l7 10 l6 -10 l7 10 l6 -10 l7 10 l6 -10 l7 10 l6 -10" stroke="${hair}" stroke-width="5" fill="none"/>`; defs += grad(.5, .75); cap = `<rect x="40" y="40" width="120" height="110" fill="url(#g-${type})"/>`; break;
    case 'design': defs += grad(.25, .55); cap = `<rect x="40" y="40" width="120" height="110" fill="url(#g-${type})"/>`; top = `<path d="M58 84 Q56 38 100 34 Q144 38 142 84 Q126 64 100 62 Q74 64 58 84z" fill="${hair}"/>`; extra = `<path d="M56 98 l14 -10 l10 10 l14 -12" stroke="${red}" stroke-width="3" fill="none"/><path d="M144 98 l-14 -10 l-10 10 l-14 -12" stroke="${red}" stroke-width="3" fill="none"/>`; break;
    case 'beard': defs += grad(.25, .55); cap = `<rect x="40" y="40" width="120" height="110" fill="url(#g-${type})"/>`; top = `<path d="M58 84 Q56 40 100 36 Q144 40 142 84 Q126 64 100 62 Q74 64 58 84z" fill="${hair}"/>`; extra = `<path d="M52 118 Q54 176 100 180 Q146 176 148 118 Q140 150 100 152 Q60 150 52 118z" fill="${hair}"/><path d="M84 142 Q100 134 116 142" stroke="${skin}" stroke-width="5" fill="none"/>`; break;
  }
  return `<svg class="hairsvg" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>
    <rect width="200" height="240" fill="#121212"/>
    <circle cx="100" cy="120" r="96" fill="${red}" opacity=".08"/>
    <path d="M30 240 Q34 196 80 190 L120 190 Q166 196 170 240z" fill="${skin}"/>
    <rect x="82" y="160" width="36" height="40" fill="${skin}"/>
    <ellipse cx="50" cy="118" rx="8" ry="14" fill="${skin}"/><ellipse cx="150" cy="118" rx="8" ry="14" fill="${skin}"/>
    ${type === 'afro' ? top : ''}
    <ellipse cx="100" cy="112" rx="50" ry="62" fill="${skin}"/>
    <g clip-path="url(#h-${type})">${cap}</g>
    ${type !== 'afro' ? top : ''}${extra}
  </svg>`;
};
