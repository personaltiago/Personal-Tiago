(function (host) {
  'use strict';
  const Water = host.APAquariumWater;
  const PLANTS = {
    jardim: [[.01,.18,.18,.58],[.77,.24,.99,.64]], ruinas: [[0,.2,.11,.53],[.78,.52,.97,.72]],
    cristais: [[.12,.30,.30,.62],[.61,.38,.76,.66]], cachoeira: [[.01,.06,.22,.62]],
    naufragio: [[.02,.02,.13,.38],[.87,.08,.99,.49]],
  };
  const VERTEX = `attribute vec2 a_uv; varying mediump vec2 v_uv;
    void main(){v_uv=a_uv;gl_Position=vec4((a_uv*2.-1.)*vec2(1.,-1.),0.,1.);}`;
  const WATER = `precision mediump float; varying mediump vec2 v_uv;
    uniform sampler2D u_scene; uniform vec2 u_cover;
    uniform float u_time,u_motion,u_crystal,u_falls; uniform vec4 u_plants[3];
    float mask(vec2 p,vec4 r){return smoothstep(r.x,r.x+.04,p.x)*(1.-smoothstep(r.z-.04,r.z,p.x))*smoothstep(r.y,r.y+.04,p.y)*(1.-smoothstep(r.w-.04,r.w,p.y));}
    void main(){
      vec2 uv=(v_uv-.5)*u_cover+.5;
      float plant=0.;for(int i=0;i<3;i++)plant+=mask(uv,u_plants[i]);
      uv.x+=sin(u_time*1.3+uv.y*11.)*.0018*plant*u_motion;
      uv.x+=sin(uv.y*80.+u_time*.65)*.0017*(1.-smoothstep(.02,.25,uv.y))*u_motion;
      if(u_falls>.5)uv.y+=sin(uv.y*120.-u_time*8.)*.0012*mask(uv,vec4(.68,.2,.91,.8))*u_motion;
      vec3 col=texture2D(u_scene,uv).rgb;
      float beam=pow(max(0.,sin(v_uv.x*11.+v_uv.y*.8+sin(u_time*.21)*.24)),16.)*.023;
      float sheen=pow(max(0.,sin(v_uv.x*51.+v_uv.y*32.+u_time*.37)*sin(v_uv.x*22.-v_uv.y*41.-u_time*.29)),12.)*.034;
      col+=vec3(.72,.91,1.)*(beam+sheen)*u_motion*(1.-v_uv.y*.55);
      col+=vec3(.24,.05,.36)*(.009+.004*sin(u_time*.6))*u_crystal*u_motion;
      gl_FragColor=vec4(col,1.);
    }`;
  const BUBBLE_VERTEX = `attribute vec4 a_bubble; uniform vec2 u_resolution; uniform float u_dpr;
    varying mediump float v_opacity; void main(){
      gl_Position=vec4((a_bubble.xy/u_resolution*2.-1.)*vec2(1.,-1.),0.,1.);
      gl_PointSize=a_bubble.z*2.*u_dpr;v_opacity=a_bubble.w;
    }`;
  const BUBBLE_FRAGMENT = `precision mediump float; uniform sampler2D u_bubble; varying mediump float v_opacity;
    void main(){vec4 b=texture2D(u_bubble,gl_PointCoord);gl_FragColor=vec4(b.rgb,b.a*v_opacity);}`;
  const FISH_VERTEX = `attribute vec2 a_uv; varying mediump vec2 v_uv;
    uniform vec2 u_resolution,u_center,u_size;
    uniform float u_stroke,u_speed,u_direction,u_anchor,u_head,u_bend,u_pitch,u_strength;
    uniform mediump float u_front;
    void main(){
      v_uv=a_uv;
      float rib=clamp((u_head-a_uv.x)/u_head,0.,1.), tip=pow(rib,1.45);
      float strength=(1.-.32*u_front)*u_strength;
      float sweep=sin(u_stroke-a_uv.x*7.5), fold=sin(u_stroke*1.28-a_uv.x*9.);
      float x=a_uv.x-u_anchor+(sweep*(.075+.036*u_speed)+u_bend*.065)*tip*strength;
      float y=(a_uv.y-.5)*(1.+fold*.29*pow(rib,.84)*strength)
        +(sin(u_stroke-a_uv.x*7.5+.8)*(.092+.031*u_speed)+u_bend*.084)*tip*strength;
      vec2 p=vec2(x*u_size.x*u_direction,y*u_size.y);
      float c=cos(u_pitch),s=sin(u_pitch);p=vec2(c*p.x-s*p.y,s*p.x+c*p.y);
      gl_Position=vec4(((p+u_center)/u_resolution*2.-1.)*vec2(1.,-1.),0.,1.);
    }`;
  const FISH_FRAGMENT = `precision mediump float; varying mediump vec2 v_uv;
    uniform sampler2D u_fish,u_turn; uniform mediump float u_front; uniform float u_opacity;
    void main(){
      vec4 a=texture2D(u_fish,v_uv),b=texture2D(u_turn,v_uv);
      vec4 p=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),u_front);
      gl_FragColor=p*u_opacity;
    }`;
  function smooth(low,high,value) {
    const t=Math.max(0,Math.min(1,(value-low)/(high-low)));
    return t*t*(3-2*t);
  }
  const size = image => [image.naturalWidth || image.width,image.naturalHeight || image.height];
  const cover = (w,h,iw,ih) => w/h>iw/ih ? [1,iw*h/(ih*w)] : [w*ih/(h*iw),1];
  function pose(frame,images,width,height,reduced) {
    const [iw,ih]=size(images.fish), axis=Math.cos(frame.face), sideways=Math.abs(axis);
    const front=images.turn ? Math.max(frame.front*.84,1-smooth(.15,.91,sideways)) : 0;
    const anchor=images.rig?.head?.[0] ?? .84, fullWidth=frame.width*width;
    const right=smooth(-.24,.24,axis);
    return {
      front,anchor,head:images.rig?.headStart ?? .76,sourceWidth:iw,sourceHeight:ih,
      x:frame.x*width+(anchor-.5)*fullWidth*axis,y:frame.y*height,
      width:fullWidth*(.40+.60*sideways),height:fullWidth*ih/iw,
      stroke:frame.stroke,speed:frame.speed,bend:frame.bend,pitch:frame.pitch,strength:reduced ? 0 : 1,
      // Both silhouettes share one head pivot during the front-facing transition.
      directions:[[-1,1-right],[1,right]],
    };
  }

  class Renderer {
    constructor(node) {
      this.node=node;
      this.doc=node.ownerDocument;
      this.canvas=this.createCanvas();
      this.bubble=Water.bubbleSprite(this.doc);
      this.textures=new Map();
      this.lost=false;
      try {
        this.gl=this.canvas.getContext('webgl',{alpha:false,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
        if(!this.gl) throw Error('Canvas');
        this.setupGL();
      } catch {
        this.gl=null;
        this.canvas=this.createCanvas();
        this.ctx=this.canvas.getContext('2d',{alpha:false});
        this.blend=this.doc.createElement('canvas');
      }
      this.onLost=event=>{event.preventDefault();this.lost=true};
      this.onRestored=()=>{this.textures.clear();this.setupGL();this.lost=false};
      this.canvas.addEventListener('webglcontextlost',this.onLost);
      this.canvas.addEventListener('webglcontextrestored',this.onRestored);
      node.append(this.canvas);
      this.resize();
    }
    createCanvas() {
      const canvas=this.doc.createElement('canvas');
      canvas.className='ap-aquarium-canvas';
      canvas.setAttribute('aria-hidden','true');
      return canvas;
    }
    program(vertex,fragment,attribute,names) {
      const gl=this.gl;
      function shader(type,source) {
        const value=gl.createShader(type);
        gl.shaderSource(value,source);gl.compileShader(value);
        if(!gl.getShaderParameter(value,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(value));
        return value;
      }
      const program=gl.createProgram(), vs=shader(gl.VERTEX_SHADER,vertex), fs=shader(gl.FRAGMENT_SHADER,fragment);
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      return {program,attribute:gl.getAttribLocation(program,attribute),
        uniforms:Object.fromEntries(names.split(' ').map(name=>[name,gl.getUniformLocation(program,'u_'+name)]))};
    }
    setupGL() {
      const gl=this.gl;
      this.water=this.program(VERTEX,WATER,'a_uv','scene cover time motion crystal falls plants[0] plants[1] plants[2]');
      this.bubbles=this.program(BUBBLE_VERTEX,BUBBLE_FRAGMENT,'a_bubble','resolution dpr bubble');
      this.fish=this.program(FISH_VERTEX,FISH_FRAGMENT,'a_uv','resolution center size stroke speed direction anchor head front bend pitch strength fish turn opacity');
      const buffer=data=>{
        const result=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,result);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
        return result;
      };
      this.quad=buffer([0,0,1,0,0,1,0,1,1,0,1,1]);
      const vertices=[];
      for(let y=0;y<8;y++) for(let x=0;x<28;x++) vertices.push(x/28,y/8,(x+1)/28,y/8,x/28,(y+1)/8,x/28,(y+1)/8,(x+1)/28,y/8,(x+1)/28,(y+1)/8);
      this.mesh=buffer(vertices);this.meshCount=vertices.length/2;
      this.particles=gl.createBuffer();
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    }
    resize() {
      const rect=this.node.getBoundingClientRect(),win=this.doc.defaultView||host;
      this.w=Math.max(1,rect.width);this.h=Math.max(1,rect.height);
      this.dpr=Math.min(1.75,win.devicePixelRatio||1);
      const w=Math.round(this.w*this.dpr),h=Math.round(this.h*this.dpr);
      if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}
      return this;
    }
    setImages(images) {
      if(this.images?.key===images.key) return;
      if(this.gl) for(const texture of this.textures.values()) this.gl.deleteTexture(texture);
      this.textures.clear();this.images=images;
      this.scene=Water.sceneTexture(this.doc,images.scene,images.sceneId);
      this.bubbleField=Water.particleField(images.sceneId);
    }
    texture(image,unit) {
      const gl=this.gl;
      gl.activeTexture(gl.TEXTURE0+unit);
      let texture=this.textures.get(image);
      if(texture){gl.bindTexture(gl.TEXTURE_2D,texture);return}
      texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      this.textures.set(image,texture);
    }
    draw(frame,reduced=false) {
      if(!this.images||this.lost) return;
      const crop=cover(this.w,this.h,...size(this.scene));
      const bubbles=this.bubbleField(reduced?0:frame.time,this.w,this.h,crop);
      const fish=pose(frame,this.images,this.w,this.h,reduced);
      if(this.gl) this.drawGL(frame,fish,crop,bubbles,reduced);
      else this.drawCanvas(frame,fish,crop,bubbles,reduced);
    }
    drawGL(frame,fish,crop,bubbles,reduced) {
      const gl=this.gl,images=this.images,w=this.w,h=this.h;
      const use=(pass,buffer,components)=>{
        gl.useProgram(pass.program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
        gl.enableVertexAttribArray(pass.attribute);
        gl.vertexAttribPointer(pass.attribute,components,gl.FLOAT,false,0,0);
        return pass.uniforms;
      };
      gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.disable(gl.BLEND);
      let u=use(this.water,this.quad,2);
      this.texture(this.scene,0);gl.uniform1i(u.scene,0);gl.uniform2f(u.cover,...crop);
      gl.uniform1f(u.time,frame.time%(200*Math.PI));gl.uniform1f(u.motion,reduced?0:1);
      gl.uniform1f(u.crystal,Number(images.sceneId==='aq-cristais'));
      gl.uniform1f(u.falls,Number(images.sceneId==='aq-cachoeira'));
      const plants=PLANTS[images.sceneId.slice(3)]||[];
      for(let i=0;i<3;i++) gl.uniform4f(u[`plants[${i}]`],...(plants[i]||[-1,-1,-.9,-.9]));
      gl.drawArrays(gl.TRIANGLES,0,6);gl.disableVertexAttribArray(this.water.attribute);

      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      u=use(this.bubbles,this.particles,4);
      gl.bufferData(gl.ARRAY_BUFFER,bubbles,gl.DYNAMIC_DRAW);
      this.texture(this.bubble,0);gl.uniform1i(u.bubble,0);
      gl.uniform2f(u.resolution,w,h);gl.uniform1f(u.dpr,this.dpr);
      gl.drawArrays(gl.POINTS,0,bubbles.length/4);gl.disableVertexAttribArray(this.bubbles.attribute);

      gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);u=use(this.fish,this.mesh,2);
      this.texture(images.fish,0);this.texture(images.turn||images.fish,1);
      gl.uniform1i(u.fish,0);gl.uniform1i(u.turn,1);
      gl.uniform2f(u.resolution,w,h);gl.uniform2f(u.center,fish.x,fish.y);
      gl.uniform2f(u.size,fish.width,fish.height);
      for(const name of ['stroke','speed','anchor','head','front','strength']) gl.uniform1f(u[name],fish[name]);
      for(const [direction,opacity] of fish.directions){
        if(opacity<.001) continue;
        gl.uniform1f(u.direction,direction);gl.uniform1f(u.opacity,opacity);
        gl.uniform1f(u.bend,fish.bend*direction);gl.uniform1f(u.pitch,fish.pitch*direction);
        gl.drawArrays(gl.TRIANGLES,0,this.meshCount);
      }
      gl.disableVertexAttribArray(this.fish.attribute);
    }
    drawCanvas(frame,fish,crop,bubbles,reduced) {
      const ctx=this.ctx,images=this.images,w=this.w,h=this.h;
      if(!ctx) return;
      const [sw,sh]=size(this.scene),iw=sw*crop[0],ih=sh*crop[1];
      ctx.setTransform(this.canvas.width/w,0,0,this.canvas.height/h,0,0);
      ctx.globalAlpha=1;ctx.drawImage(this.scene,(sw-iw)/2,(sh-ih)/2,iw,ih,0,0,w,h);
      if(!reduced){
        const slope=Math.sin(frame.time*.42)*w*.18;
        const light=ctx.createLinearGradient(w*.24+slope,0,w*.63+slope,h);
        light.addColorStop(0,'rgba(170,230,255,0)');light.addColorStop(.28,'rgba(170,230,255,.037)');
        light.addColorStop(.62,'rgba(170,230,255,0)');ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
      }
      for(let i=0;i<bubbles.length;i+=4){
        const x=bubbles[i],y=bubbles[i+1],r=bubbles[i+2];
        if(x<-r||y<-r||x>w+r||y>h+r) continue;
        ctx.globalAlpha=bubbles[i+3];ctx.drawImage(this.bubble,x-r,y-r,r*2,r*2);
      }
      ctx.globalAlpha=1;
      const {sourceWidth,sourceHeight}=fish;
      if(this.blend.width!==sourceWidth||this.blend.height!==sourceHeight){this.blend.width=sourceWidth;this.blend.height=sourceHeight}
      const blend=this.blend.getContext('2d');
      blend.clearRect(0,0,sourceWidth,sourceHeight);
      blend.globalCompositeOperation='source-over';blend.globalAlpha=1-fish.front;
      blend.drawImage(images.fish,0,0,sourceWidth,sourceHeight);
      if(images.turn&&fish.front>0){
        blend.globalCompositeOperation='lighter';blend.globalAlpha=fish.front;
        blend.drawImage(images.turn,0,0,sourceWidth,sourceHeight);
      }
      blend.globalAlpha=1;blend.globalCompositeOperation='source-over';
      const strength=(1-.32*fish.front)*fish.strength,strips=36;
      const tail=u=>Math.max(0,(fish.head-u)/fish.head);
      const slice=sourceWidth/strips;
      for(const [direction,opacity] of fish.directions){
        if(opacity<.001) continue;
        const bend=fish.bend*direction;
        const px=u=>(u-fish.anchor+(Math.sin(fish.stroke-u*7.5)*(.075+.036*fish.speed)+bend*.065)*tail(u)**1.45*strength)*fish.width;
        const py=u=>(Math.sin(fish.stroke-u*7.5+.8)*(.092+.031*fish.speed)+bend*.084)*tail(u)**1.45*strength*fish.height;
        ctx.save();ctx.globalAlpha=opacity;
        ctx.translate(fish.x,fish.y);ctx.rotate(fish.pitch*direction);ctx.scale(direction,1);
        for(let i=0;i<strips;i++){
          const u=(i+.5)/strips,rib=tail(u);
          const height=fish.height*(1+Math.sin(fish.stroke*1.28-u*9)*.29*rib**.84*strength);
          const left=px(i/strips),right=px((i+1)/strips);
          const top=py(i/strips),bottom=py((i+1)/strips);
          ctx.save();
          // Shear the slices along the wave so the silhouette has no stepped offsets.
          ctx.transform((Math.max(.1,right-left)+.38)/slice,(bottom-top)/slice,0,height/sourceHeight,left,top-height/2);
          ctx.drawImage(this.blend,i*slice,0,slice,sourceHeight,0,0,slice,sourceHeight);
          ctx.restore();
        }
        ctx.restore();
      }
    }
    dispose() {
      this.canvas.removeEventListener('webglcontextlost',this.onLost);
      this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
      const gl=this.gl;
      if(gl){
        for(const texture of this.textures.values()) gl.deleteTexture(texture);
        for(const pass of [this.water,this.bubbles,this.fish]) gl.deleteProgram(pass.program);
        for(const buffer of [this.quad,this.mesh,this.particles]) gl.deleteBuffer(buffer);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
      this.canvas.remove();this.images=null;
    }
  }
  host.APAquariumRenderer=Renderer;
})(globalThis);
