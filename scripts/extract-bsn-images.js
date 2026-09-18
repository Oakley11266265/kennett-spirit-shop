/* ============================================================================
   KENNETT SPIRIT SHOP — PRODUCT PHOTO CAPTURE   ** DOES NOT WORK — SEE BELOW **

   Tried 2026-09-17 against the live store: 0 captured, 836 failed. Every
   request came back "net::ERR_FAILED 200 (OK)" — the image downloaded fine,
   and the browser then refused to let script read it:

     Access to fetch at 'https://cache.bsnsports.com/comp/render?...'
     from origin 'https://sideline.bsnsports.com' has been blocked by CORS
     policy: No 'Access-Control-Allow-Origin' header is present

   cache.bsnsports.com sends no CORS header, so fetch() cannot read the bytes
   and <img> + canvas taints the canvas, making toDataURL() throw. There is no
   browser-side way around that, and there should not be.

   This does NOT affect showing the photos. Cross-origin <img> display needs no
   CORS at all — which is why BSN's own storefront renders these same images
   from this same host. The storefront displays them correctly the moment it
   runs on a real URL.

   Two ways to get photos, then:
     1. Deploy the site. <img src="https://cache.bsnsports.com/..."> just works.
        Only a sandboxed preview blocks external images, via its own CSP.
     2. To bundle copies (offline-proof, CDN-change-proof), fetch them from a
        server rather than a browser — no CORS involved — and write
        public/products/images.json. See scripts/import-bsn.mjs --mirror.

   Kept for the record. Do not paste this into a console expecting photos.
   ========================================================================== */

(async()=>{const A=u=>{try{return new URL(u,location.origin).href}catch{return null}},
M=new Map(),
img=i=>i.getAttribute('data-src')||i.getAttribute('data-original')||(i.getAttribute('srcset')||'').split(/\s|,/)[0]||i.currentSrc||i.src,
grab=d=>{d.querySelectorAll('a[href*="/product/view/"]').forEach(a=>{const id=(a.getAttribute('href')||'').match(/\/product\/view\/(\d+)/);if(!id)return;const i=a.querySelector('img')||a.parentElement?.querySelector('img');if(!i)return;const u=A(img(i));if(u&&!M.has(id[1]))M.set(id[1],u)})};
grab(document);
const L=new Set();document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href')||'';if(/\/shop\//.test(h)&&!/cart|checkout|account|\?/.test(h))L.add(A(h))});
console.log('%c[kennett] finding products across '+L.size+' pages…','color:#1b4ac6;font-weight:bold');
for(const u of L){try{const r=await fetch(u);if(r.ok)grab(new DOMParser().parseFromString(await r.text(),'text/html'));await new Promise(z=>setTimeout(z,250))}catch(e){}}
const list=[...M.entries()];
console.log('%c[kennett] downloading '+list.length+' product photos…','color:#1b4ac6;font-weight:bold');
// Re-render each photo on our dark background at a small size, then re-encode.
// Prefer a transparent cut-out: it sits correctly on any background, which a
// baked-in colour never does. Falls back to our page colour if BSN insists on
// painting one in.
let MODE='transparent';
const fix=u=>{try{const x=new URL(u);x.searchParams.set('w','520');x.searchParams.set('h','520');x.searchParams.set('f','png');
if(MODE==='transparent')x.searchParams.delete('bc');else x.searchParams.set('bc','0a1128');return x.toString()}catch{return u}};
const out={}; let done=0, failed=0;
const shrink=async(blob)=>{const bmp=await createImageBitmap(blob);const S=260;const c=document.createElement('canvas');c.width=S;c.height=S;const g=c.getContext('2d');
if(MODE!=='transparent'){g.fillStyle='#0a1128';g.fillRect(0,0,S,S)}
const s=Math.min(S/bmp.width,S/bmp.height);const w=bmp.width*s,h=bmp.height*s;g.drawImage(bmp,(S-w)/2,(S-h)/2,w,h);bmp.close();
return c.toDataURL('image/webp',0.75)};
// Probe one photo first: is the corner see-through, or did BSN paint it?
const probe=async(url)=>{try{const r=await fetch(fix(url),{credentials:'omit'});const bmp=await createImageBitmap(await r.blob());
const c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;const g=c.getContext('2d');g.drawImage(bmp,0,0);
const d=g.getImageData(3,3,1,1).data;bmp.close();
if(d[3]<20){console.log('%c[kennett] transparent cut-outs available — using them','color:#1b4ac6;font-weight:bold');return}
MODE='painted';console.log('%c[kennett] BSN paints a background; matching it to the page instead','color:#b8860b;font-weight:bold');
}catch(e){MODE='painted'}};
const work=async(q)=>{while(q.length){const [id,url]=q.shift();try{const r=await fetch(fix(url),{credentials:'omit'});if(!r.ok)throw 0;out[id]=await shrink(await r.blob())}catch(e){failed++}
if(++done%50===0)console.log('  '+done+'/'+list.length)}};
if(list.length)await probe(list[0][1]);
const q=[...list];await Promise.all(Array.from({length:6},()=>work(q)));
const json=JSON.stringify({at:new Date().toISOString(),count:Object.keys(out).length,images:out});
console.log('%c[kennett] '+Object.keys(out).length+' PHOTOS CAPTURED'+(failed?' ('+failed+' failed)':''),'color:#1b4ac6;font-size:16px;font-weight:bold');
console.log('file size: '+(json.length/1048576).toFixed(1)+' MB');
const b=new Blob([json],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='kennett-images.json';document.body.appendChild(a);a.click();a.remove();
console.log('Saved kennett-images.json to Downloads — send that file to Claude.');
window.KIMG=out})()
