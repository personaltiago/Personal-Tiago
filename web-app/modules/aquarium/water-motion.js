(function (host) {
  'use strict';
  // Positions in the source image keep the streams aligned as the scene crops.
  const streams = {
    'aq-jardim': [[.511,.489,.148,.64,.042,26],[.782,.775,.115,.458,.047,20],[.309,.302,.145,.265,.034,8]],
    'aq-ruinas': [[.262,.277,.105,.544,.048,32],[.702,.688,.082,.194,.046,8]],
    'aq-cristais': [[.362,.357,.139,.561,.042,29],[.697,.682,.171,.428,.041,19]],
    'aq-cachoeira': [[.632,.615,.201,.55,.034,22],[.721,.703,.123,.266,.037,13]],
    'aq-naufragio': [[.636,.616,.16,.682,.032,30],[.688,.682,.145,.416,.025,14]],
  };
  const surfaces = new WeakMap();
  function smooth(low, high, value) {
    const t = Math.min(1, Math.max(0, (value - low) / (high - low)));
    return t * t * (3 - 2 * t);
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const luma = (r, g, b) => .21 * r + .72 * g + .07 * b;

  function sceneTexture(doc, image, sceneId) {
    if (surfaces.has(image)) return surfaces.get(image);
    const regions = streams[sceneId];
    if (!regions) return image;
    const canvas = doc.createElement('canvas');
    const width = canvas.width = image.naturalWidth || image.width;
    const height = canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return image;
    try {
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, width, height);
      const data = pixels.data;
      const source = new Uint8ClampedArray(data);
      const radius = Math.max(2, Math.round(width * .009));
      const offsets = [-radius,radius,-radius*width,radius*width,-(width+1)*radius,(width+1)*radius];
      // Replace small bright peaks only in the original bubble columns.
      for (const [topX,bottomX,top,bottom,spread] of regions) {
        for (let y = Math.max(radius,Math.ceil(top*height)); y < Math.min(height-radius,bottom*height); y++) {
          const v = y / height;
          const center = lerp(topX,bottomX,(v-top)/(bottom-top));
          const edge = smooth(top,top+.023,v)*(1-smooth(bottom-.030,bottom,v));
          for (let x=Math.max(radius,Math.ceil((center-spread)*width)); x<Math.min(width-radius,(center+spread)*width); x++) {
            const pixel=(y*width+x)*4;
            if (source[pixel+2]<source[pixel]*.94) continue;
            let r=0,g=0,b=0,brightest=-1,darkest=256,hi=pixel,lo=pixel;
            for (const offset of offsets) {
              const i=pixel+offset*4,light=luma(source[i],source[i+1],source[i+2]);
              if (light>brightest) { brightest=light; hi=i; }
              if (light<darkest) { darkest=light; lo=i; }
              r+=source[i]; g+=source[i+1]; b+=source[i+2];
            }
            r=(r-source[hi]-source[lo])/4;
            g=(g-source[hi+1]-source[lo+1])/4;
            b=(b-source[hi+2]-source[lo+2])/4;
            const peak=luma(source[pixel],source[pixel+1],source[pixel+2])-luma(r,g,b);
            const fade=1-smooth(spread*.72,spread,Math.abs(x/width-center));
            const blend=smooth(3,10,peak)*edge*fade;
            data[pixel]=lerp(data[pixel],r,blend);
            data[pixel+1]=lerp(data[pixel+1],g,blend);
            data[pixel+2]=lerp(data[pixel+2],b,blend);
          }
        }
      }
      ctx.putImageData(pixels,0,0);
      surfaces.set(image,canvas);
      return canvas;
    } catch {
      return image;
    }
  }

  function particleField(sceneId) {
    const particles=[];
    let seed=41229;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for (const [topX,bottomX,top,bottom,spread,count] of streams[sceneId] || []) {
      for (let i=0;i<count;i++) {
        particles.push({topX,bottomX,top,bottom,phase:(i+random())/count,
          offset:(random()*2-1)*spread*.67,sway:.002+random()*.007,
          speed:.155+random()*.145,radius:1.6+random()**1.7*2.4,
          opacity:.46+random()*.46,seed:random()*6.283});
      }
    }
    const buffer=new Float32Array(particles.length*4);
    return (time,width,height,crop)=>{
      let index=0;
      for (const p of particles) {
        const rise=(time*p.speed+p.phase)%1;
        const u=lerp(p.bottomX,p.topX,rise)+p.offset*(.45+rise*.7)
          +Math.sin(time*2.2+p.seed+rise*4)*p.sway;
        const v=lerp(p.bottom,p.top,rise);
        buffer[index++]=((u-.5)/crop[0]+.5)*width;
        buffer[index++]=((v-.5)/crop[1]+.5)*height;
        buffer[index++]=p.radius*(1+rise*.19)*Math.max(.78,Math.min(1.35,height/430));
        buffer[index++]=p.opacity*smooth(0,.09,rise)*(1-smooth(.87,1,rise));
      }
      return buffer;
    };
  }

  function bubbleSprite(doc) {
    const sprite=doc.createElement('canvas');
    sprite.width=sprite.height=32;
    const ctx=sprite.getContext('2d');
    const glass=ctx.createRadialGradient(15,15,3,16,16,15);
    glass.addColorStop(0,'rgba(105,190,217,0)');
    glass.addColorStop(.65,'rgba(120,202,222,.07)');
    glass.addColorStop(.86,'rgba(171,230,245,.65)');
    glass.addColorStop(1,'rgba(193,240,251,0)');
    ctx.fillStyle=glass; ctx.fillRect(0,0,32,32);
    ctx.lineCap='round'; ctx.strokeStyle='rgba(235,254,255,.95)'; ctx.lineWidth=2.8;
    ctx.beginPath(); ctx.arc(16,16,11.6,3.63,4.79); ctx.stroke();
    ctx.strokeStyle='rgba(210,245,255,.55)'; ctx.lineWidth=1.9;
    ctx.beginPath(); ctx.arc(16,16,11.4,.52,1.25); ctx.stroke();
    return sprite;
  }
  host.APAquariumWater=Object.freeze({sceneTexture,particleField,bubbleSprite});
})(globalThis);
