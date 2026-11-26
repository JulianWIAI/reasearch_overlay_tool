(()=>{var u=class{constructor({canvas:t,state:e,window:i,colorInput:s,sizeInput:n}){this.canvas=t,this.state=e,this.window=i,this.colorInput=s,this.sizeInput=n,this.context=t.getContext("2d"),this.abortController=new AbortController,this.currentStroke=null,this.backingCanvas=this.window.document.createElement("canvas"),this.backingContext=this.backingCanvas.getContext("2d"),this.logicalWidth=0,this.logicalHeight=0,this.resize=this.resize.bind(this),this.render=this.render.bind(this),this.canvas.addEventListener("pointerdown",o=>this.onPointerDown(o),{signal:this.abortController.signal}),this.canvas.addEventListener("pointermove",o=>this.onPointerMove(o),{signal:this.abortController.signal}),this.window.addEventListener("pointerup",o=>this.onPointerUp(o),{signal:this.abortController.signal}),this.window.addEventListener("resize",this.resize,{signal:this.abortController.signal}),this.unsubscribe=e.subscribe(this.render),this.resize()}resize(){let t=Math.max(1,Math.round(this.window.innerWidth)),e=Math.max(1,Math.round(this.window.innerHeight));!this.context||!this.backingContext||(this.canvas.width=t,this.canvas.height=e,this.context=this.canvas.getContext("2d"),this.logicalWidth=Math.max(this.logicalWidth,t),this.logicalHeight=Math.max(this.logicalHeight,e),this.backingCanvas.width=this.logicalWidth,this.backingCanvas.height=this.logicalHeight,this.backingContext=this.backingCanvas.getContext("2d"),this.render())}onPointerDown(t){!this.context||this.state.mode==="move"||this.state.clickThrough||(this.currentStroke={mode:this.state.mode,color:this.colorInput.value,size:Number(this.sizeInput.value)*(this.state.mode==="erase"?3:1),points:[{x:t.clientX,y:t.clientY}]},this.canvas.setPointerCapture?.(t.pointerId))}onPointerMove(t){this.currentStroke&&(this.currentStroke.points.push({x:t.clientX,y:t.clientY}),this.renderStroke(this.currentStroke))}onPointerUp(t){if(!this.currentStroke)return;let e=this.currentStroke;this.currentStroke=null,this.canvas.releasePointerCapture?.(t.pointerId),this.state.transaction(i=>i.strokes.push(e))}renderStroke(t){if(!this.context||t.points.length===0)return;let{context:e}=this;e.save?.(),e.globalCompositeOperation=t.mode==="erase"?"destination-out":"source-over",e.strokeStyle=t.color,e.lineWidth=t.size,e.lineCap="round",e.lineJoin="round",e.beginPath(),e.moveTo(t.points[0].x,t.points[0].y),t.points.slice(1).forEach(i=>e.lineTo(i.x,i.y)),e.stroke(),e.restore?.()}drawStrokeTo(t,e){let i=this.context;this.context=t,this.renderStroke(e),this.context=i}render(){!this.context||!this.backingContext||(this.backingContext.clearRect(0,0,this.logicalWidth,this.logicalHeight),this.state.strokes.forEach(t=>this.drawStrokeTo(this.backingContext,t)),this.currentStroke&&this.drawStrokeTo(this.backingContext,this.currentStroke),this.context.clearRect(0,0,this.canvas.width,this.canvas.height),this.context.drawImage?.(this.backingCanvas,0,0,this.canvas.width,this.canvas.height,0,0,this.canvas.width,this.canvas.height))}destroy(){this.abortController.abort(),this.unsubscribe(),this.backingCanvas.width=1,this.backingCanvas.height=1}};function h(r,t){let e=Number(r);return Number.isFinite(e)?e:t}function g(r,t,e){return Math.min(Math.max(r,t),Math.max(t,e))}function w(r){return{width:Math.max(1,h(r.innerWidth,1)),height:Math.max(1,h(r.innerHeight,1))}}function p(r,t,e){let i=Math.max(1,h(t,1)),s=Math.max(1,h(e,1)),n=g(h(r.width,60),Math.min(60,i),i),o=g(h(r.height,40),Math.min(40,s),s);return{x:Math.round(g(h(r.x,0),0,i-n)),y:Math.round(g(h(r.y,0),0,s-o)),width:Math.round(n),height:Math.round(o)}}var k=0,S=10,E=64;function m(r){let t=Number(r);return Math.min(E,Math.max(S,Number.isFinite(t)?t:15))}function O(){return k+=1,globalThis.crypto?.randomUUID?.()??`overlay-${Date.now()}-${k}`}var b=class{constructor({layer:t,state:e,window:i,onStatus:s}){this.layer=t,this.state=e,this.window=i,this.onStatus=s??(()=>{}),this.objectUrls=new Map,this.urlFiles=new Map,this.abortController=new AbortController,this.unsubscribe=e.subscribe(()=>this.render()),this.layer.ownerDocument.defaultView?.addEventListener("resize",()=>this.keepItemsInBounds(),{signal:this.abortController.signal})}addText(){this.addItem({type:"text",width:260,height:130,textContent:"",fontSize:15,isBold:!1})}addFiles(t){[...t].forEach(e=>{let i=e.type.startsWith("video/")?"video":e.type.startsWith("image/")?"image":null;if(!i){this.onStatus(`Skipped unsupported file: ${e.name}`);return}this.addItem({type:i,width:i==="video"?360:300,height:i==="video"?220:240,file:e,fileName:e.name,mimeType:e.type})})}addItem(t){this.state.transaction(e=>{e.mode="move";let i=e.items.length*28%280;e.zOrder+=1;let s=p({x:80+i,y:90+i,width:t.width,height:t.height},this.window.innerWidth,this.window.innerHeight);e.items.push({id:O(),opacity:1,zIndex:e.zOrder,...t,...s})})}render(){let t=new Set(this.state.items.map(e=>e.id));for(let[e,i]of this.objectUrls){let s=this.state.items.find(n=>n.id===e);(!t.has(e)||!s?.file||this.urlFiles.get(e)!==s.file)&&(this.window.URL.revokeObjectURL(i),this.objectUrls.delete(e),this.urlFiles.delete(e))}this.layer.querySelectorAll(".overlay-item").forEach(e=>e.remove()),this.state.items.forEach(e=>this.layer.appendChild(this.createElement(e)))}createElement(t){let e=this.layer.ownerDocument.createElement("div");e.className="overlay-item",e.dataset.itemId=t.id,e.dataset.type=t.type,e.classList.toggle("click-through",this.state.clickThrough),e.style.left=`${t.x}px`,e.style.top=`${t.y}px`,e.style.width=`${t.width}px`,e.style.height=`${t.height}px`,e.style.zIndex=String(t.zIndex),e.tabIndex=-1;let i=this.layer.ownerDocument.createElement("div");i.className="item-hud",i.innerHTML=`
      <span class="item-drag-handle" aria-label="Drag overlay item" title="Drag overlay item">
        <span aria-hidden="true">\u283F</span>
        <span class="coords">X:${Math.round(t.x)}, Y:${Math.round(t.y)}</span>
      </span>
      ${t.type==="text"?`
        <label class="text-font-control" title="Font size">
          <span class="visually-hidden">Font size</span>
          <input class="item-font-size" type="number" min="${S}" max="${E}"
            step="1" value="${m(t.fontSize)}" aria-label="Font size in pixels">
          <span aria-hidden="true">px</span>
        </label>
        <button class="bold-toggle${t.isBold?" active":""}" type="button"
          aria-label="Toggle bold" aria-pressed="${!!t.isBold}" title="Toggle bold">B</button>
      `:""}
      <input class="item-opacity" type="range" min="0.1" max="1" step="0.05"
        value="${t.opacity}" aria-label="Item opacity" title="Item opacity">
      <button class="del-btn" type="button" aria-label="Remove item" title="Remove item">\xD7</button>
    `,e.appendChild(i);let s=this.createContent(t);return e.appendChild(s),this.bindOpacity(e,s,t),this.bindTextStyling(e,s,t),this.bindRemoval(e,t),this.bindGeometry(e,t,s,i.querySelector(".coords")),this.bindText(s,t),e}createContent(t){let e=this.layer.ownerDocument;if(t.type==="text"){let n=e.createElement("textarea");return n.className="overlay-text",n.placeholder="Type an annotation\u2026",n.value=t.textContent,n.style.opacity=String(t.opacity),n.style.fontSize=`${m(t.fontSize)}px`,n.style.fontWeight=t.isBold?"700":"400",n.setAttribute("aria-label","Annotation text"),n}let i=null;if(t.file&&(i=this.objectUrls.get(t.id),i||(i=this.window.URL.createObjectURL(t.file),this.objectUrls.set(t.id,i),this.urlFiles.set(t.id,t.file))),i&&t.type==="video"){let n=e.createElement("video");return n.className="overlay-media",n.src=i,n.autoplay=!0,n.loop=!0,n.muted=!0,n.playsInline=!0,n.style.opacity=String(t.opacity),n}if(i){let n=e.createElement("img");return n.className="overlay-media",n.src=i,n.alt=t.fileName||"Overlay media",n.style.opacity=String(t.opacity),n}let s=e.createElement("div");return s.className="media-placeholder",s.textContent=t.fileName?`${t.fileName}
Re-add this local file to restore the media.`:"Local media is not embedded in JSON. Re-add the file to restore it.",s.style.opacity=String(t.opacity),s}bindOpacity(t,e,i){let s=t.querySelector(".item-opacity");s.addEventListener("pointerdown",n=>n.stopPropagation()),s.addEventListener("input",()=>{e.style.opacity=s.value}),s.addEventListener("change",()=>{let n=Number(s.value);this.state.transaction(()=>{let o=this.state.items.find(a=>a.id===i.id);o&&(o.opacity=n)})})}bindRemoval(t,e){let i=t.querySelector(".del-btn");i.addEventListener("pointerdown",s=>s.stopPropagation()),i.addEventListener("click",()=>{this.state.transaction(s=>{s.items=s.items.filter(n=>n.id!==e.id)})})}bindTextStyling(t,e,i){if(i.type!=="text")return;let s=t.querySelector(".item-font-size"),n=t.querySelector(".bold-toggle");s.addEventListener("pointerdown",o=>o.stopPropagation()),n.addEventListener("pointerdown",o=>o.stopPropagation()),s.addEventListener("change",()=>{let o=m(s.value);this.state.transaction(a=>{let l=a.items.find(d=>d.id===i.id);l&&(l.fontSize=o)})}),n.addEventListener("click",()=>{this.state.transaction(o=>{let a=o.items.find(l=>l.id===i.id);a&&(a.isBold=!a.isBold)})})}bindText(t,e){e.type==="text"&&t.addEventListener("change",()=>{this.state.transaction(i=>{let s=i.items.find(n=>n.id===e.id);s&&(s.textContent=t.value)})})}bindGeometry(t,e,i,s){let n=null;t.addEventListener("pointerdown",o=>{if(this.state.clickThrough||this.state.mode!=="move")return;let a=o.target.closest(".item-drag-handle");if(o.target.closest(".item-hud")&&!a||o.target===i&&i.tagName==="TEXTAREA")return;a&&(o.preventDefault(),o.stopPropagation()),t.classList.add("is-dragging");let l=t.getBoundingClientRect();n={pointerId:o.pointerId,resize:o.clientX>l.right-18&&o.clientY>l.bottom-18,offsetX:o.clientX-l.left,offsetY:o.clientY-l.top},t.setPointerCapture?.(o.pointerId)}),t.addEventListener("pointermove",o=>{if(!n||n.resize||o.pointerId!==n.pointerId)return;let a=p({x:o.clientX-n.offsetX,y:o.clientY-n.offsetY,width:e.width,height:e.height},this.window.innerWidth,this.window.innerHeight);t.style.left=`${a.x}px`,t.style.top=`${a.y}px`,s.textContent=`X:${a.x}, Y:${a.y}`}),t.addEventListener("pointerup",o=>{if(!n)return;let a=this.readGeometry(t);n=null,t.classList.remove("is-dragging"),t.releasePointerCapture?.(o.pointerId),this.state.transaction(l=>{let d=l.items.find(M=>M.id===e.id);d&&Object.assign(d,a)})}),t.addEventListener("pointercancel",()=>{n=null,t.classList.remove("is-dragging"),this.render()})}readGeometry(t){return p({x:Number.parseFloat(t.style.left)||0,y:Number.parseFloat(t.style.top)||0,width:Math.max(60,Number.parseFloat(t.style.width)||t.offsetWidth),height:Math.max(40,Number.parseFloat(t.style.height)||t.offsetHeight)},this.window.innerWidth,this.window.innerHeight)}keepItemsInBounds(){if(!this.state.items.length)return;let t=w(this.window),e=!1;for(let i of this.state.items){let s=p(i,t.width,t.height);Object.keys(s).some(n=>s[n]!==i[n])&&(Object.assign(i,s),e=!0)}e&&this.state.notify()}destroy(){this.abortController.abort(),this.unsubscribe();for(let t of this.objectUrls.values())this.window.URL.revokeObjectURL(t);this.objectUrls.clear(),this.urlFiles.clear(),this.layer.replaceChildren()}};function T(r){return{globalOpacity:r.globalOpacity,items:r.items.map(t=>({...t})),strokes:r.strokes.map(t=>({...t,points:t.points.map(e=>({...e}))})),zOrder:r.zOrder}}function N(r,t){let e=i=>({...i,items:i.items.map(({element:s,file:n,source:o,...a})=>a)});return JSON.stringify(e(r))===JSON.stringify(e(t))}var y=class{constructor(t={}){this.historyLimit=t.historyLimit??50,this.mode="move",this.globalOpacity=1,this.clickThrough=!1,this.visible=!0,this.active=!0,this.items=[],this.strokes=[],this.zOrder=0,this.undoStack=[],this.redoStack=[],this.listeners=new Set}subscribe(t){return this.listeners.add(t),t(this),()=>this.listeners.delete(t)}notify(){this.listeners.forEach(t=>t(this))}snapshot(){return T(this)}setMode(t){if(!["move","draw","erase"].includes(t))throw new TypeError(`Unsupported overlay mode: ${t}`);this.mode=t,this.notify()}setGlobalOpacity(t){let e=Number(t);this.globalOpacity=Math.min(1,Math.max(.1,Number.isFinite(e)?e:1)),this.notify()}toggleClickThrough(t){this.clickThrough=typeof t=="boolean"?t:!this.clickThrough,this.clickThrough&&(this.mode="move"),this.notify()}setVisibility(t){this.visible=!!t,this.active=this.visible,this.notify()}transaction(t){let e=this.snapshot();t(this);let i=this.snapshot();return N(e,i)?!1:(this.undoStack.push(e),this.undoStack.length>this.historyLimit&&this.undoStack.shift(),this.redoStack.length=0,this.notify(),!0)}undo(){let t=this.undoStack.pop();return t?(this.redoStack.push(this.snapshot()),this.restore(t),!0):!1}redo(){let t=this.redoStack.pop();return t?(this.undoStack.push(this.snapshot()),this.undoStack.length>this.historyLimit&&this.undoStack.shift(),this.restore(t),!0):!1}restore(t){Object.assign(this,T(t)),this.notify()}get canUndo(){return this.undoStack.length>0}get canRedo(){return this.redoStack.length>0}};var I=`
  :host {
    all: initial;
    display: block;
    color-scheme: dark;
    position: fixed;
    inset: 0;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    font-family: system-ui, -apple-system, sans-serif;
  }
  :host([popover]) { overflow: visible; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
  button, input, textarea { font: inherit; }
  #toolbar {
    position: fixed; top: 12px; left: 8px; transform: none;
    width: max-content; max-width: calc(100vw - 24px); background: #1e1e24;
    color: #f4f4f6; padding: 8px 10px; border: 1px solid #383842;
    border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.35);
    display: flex; align-items: center; gap: 7px; pointer-events: auto;
    z-index: 2147483647; user-select: none; flex-wrap: wrap;
    max-height: calc(100vh - 16px); overflow-y: auto; touch-action: none;
  }
  .toolbar-drag-handle {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 28px; color: #cbd5e1; cursor: grab;
    font-size: 19px; line-height: 1; border-radius: 5px; touch-action: none;
  }
  .toolbar-drag-handle:hover { background: #383842; color: #fff; }
  .toolbar-drag-handle.dragging {
    cursor: grabbing;
  }
  button, label.btn {
    background: #2b2b36; color: #fff; border: 1px solid #454554;
    padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;
  }
  button:hover, label.btn:hover { background: #3c3c4a; }
  button.active { background: #2563eb; border-color: #3b82f6; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  button.danger:hover { background: #dc2626; border-color: #ef4444; }
  .divider { width: 1px; height: 20px; background: #454554; }
  .control-group { display: flex; align-items: center; gap: 5px; font-size: 12px; }
  input[type="range"] { width: 68px; cursor: pointer; }
  input[type="color"] { width: 27px; height: 27px; border: 0; background: none; cursor: pointer; }
  #opacity-val { min-width: 34px; }
  #status {
    position: fixed; top: 58px; left: 50%; transform: translateX(-50%);
    z-index: 2147483647; max-width: min(520px, 90vw); padding: 7px 10px;
    color: #fff; background: #111827; border-radius: 6px; font-size: 12px;
    pointer-events: none;
  }
  #status:empty { display: none; }
  #overlay-layer { position: fixed; inset: 0; width: 100%; height: 100%; }
  #draw-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  #draw-canvas.drawing-mode { pointer-events: auto; cursor: crosshair; touch-action: none; }
  .overlay-item {
    position: absolute; pointer-events: auto; border: 1px dashed rgba(59,130,246,.8);
    cursor: move; min-width: 60px; min-height: 40px; resize: both; overflow: hidden;
    display: flex; flex-direction: column; background: transparent;
  }
  .overlay-item.click-through {
    pointer-events: none !important; border-color: transparent !important; resize: none !important;
  }
  .overlay-item:hover .item-hud, .overlay-item:focus-within .item-hud { opacity: 1; }
  .item-hud {
    position: absolute; top: 0; left: 0; right: 0; min-height: 22px;
    background: rgba(17,24,39,.9); color: #fff; font-size: 10px; padding: 2px 5px;
    display: flex; justify-content: space-between; align-items: center; gap: 6px;
    opacity: 0; transition: opacity .15s; z-index: 2;
  }
  .item-drag-handle {
    display: inline-flex; align-items: center; gap: 5px; min-height: 18px;
    cursor: grab; touch-action: none; user-select: none; flex: 1;
  }
  .overlay-item.is-dragging .item-drag-handle { cursor: grabbing; }
  .item-hud .item-opacity { width: 50px; }
  .text-font-control {
    display: inline-flex; align-items: center; gap: 2px; color: #cbd5e1;
    font-size: 9px; cursor: default;
  }
  .text-font-control input {
    width: 38px; height: 19px; padding: 1px 2px; border: 1px solid #64748b;
    border-radius: 3px; color: #fff; background: #1f2937; font-size: 10px;
  }
  .item-hud .bold-toggle {
    background: #374151; min-width: 20px; height: 19px; padding: 1px 4px;
    font-weight: 700; font-size: 11px;
  }
  .item-hud .bold-toggle.active { background: #2563eb; }
  .item-hud button { background: #ef4444; padding: 1px 5px; }
  .visually-hidden {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
  }
  .overlay-media, .overlay-text, .media-placeholder { width: 100%; height: 100%; }
  .overlay-media { object-fit: contain; pointer-events: none; display: block; }
  .overlay-text {
    background: rgba(255,255,255,.9); color: #111; border: 0;
    padding: 25px 8px 8px; font-size: 15px; resize: none; outline: none;
  }
  .media-placeholder {
    display: grid; place-items: center; padding: 28px 12px 12px; white-space: pre-line;
    text-align: center; color: #f8fafc; background: rgba(30,41,59,.88);
    font-size: 12px; pointer-events: none;
  }
`;var P=new Set(["text","image","video"]);function c(r){return typeof r=="number"&&Number.isFinite(r)}function C(r,t=new Date){return{schemaVersion:1,app:"ResearchOverlayTool",exportedAt:t.toISOString(),globalOpacity:r.globalOpacity,items:r.items.map(e=>({id:e.id,type:e.type,x:e.x,y:e.y,width:e.width,height:e.height,opacity:e.opacity,zIndex:e.zIndex,textContent:e.type==="text"?e.textContent:"",fontSize:e.type==="text"?e.fontSize??15:void 0,isBold:e.type==="text"?!!e.isBold:void 0,media:e.type==="text"?null:{fileName:e.fileName||null,mimeType:e.mimeType||null,portable:!1,note:"Local media is intentionally not embedded. Re-add the file after import."}})),canvas:{strokes:r.strokes}}}function L(r){if(!r||typeof r!="object"||Array.isArray(r))throw new Error("The layout must be a JSON object.");if(r.schemaVersion!==1)throw new Error("Unsupported schemaVersion. Expected 1.");if(!Array.isArray(r.items))throw new Error("The layout items field must be an array.");if(r.items.length>500)throw new Error("The layout contains too many items (maximum 500).");let t=new Set,e=r.items.map((o,a)=>{if(!o||typeof o!="object"||Array.isArray(o))throw new Error(`Item ${a+1} must be an object.`);if(typeof o.id!="string"||!o.id||t.has(o.id))throw new Error(`Item ${a+1} has an invalid or duplicate id.`);if(t.add(o.id),!P.has(o.type))throw new Error(`Item ${o.id} has an invalid type.`);for(let d of["x","y","width","height","opacity","zIndex"])if(!c(o[d]))throw new Error(`Item ${o.id} has an invalid ${d}.`);if(o.width<1||o.height<1||o.opacity<.1||o.opacity>1)throw new Error(`Item ${o.id} has dimensions or opacity outside the allowed range.`);if(o.x<-1e4||o.x>1e4||o.y<-1e4||o.y>1e4||o.width>1e4||o.height>1e4)throw new Error(`Item ${o.id} has geometry outside the safe import bounds.`);if(o.type==="text"&&typeof o.textContent!="string")throw new Error(`Text item ${o.id} is missing textContent.`);if(o.type==="text"&&o.fontSize!==void 0&&!c(o.fontSize))throw new Error(`Text item ${o.id} has an invalid fontSize.`);if(o.type==="text"&&o.isBold!==void 0&&typeof o.isBold!="boolean")throw new Error(`Text item ${o.id} has an invalid isBold value.`);let l=o.type==="text"?Math.round(Math.min(64,Math.max(10,o.fontSize??15))):void 0;return{id:o.id,type:o.type,x:o.x,y:o.y,width:o.width,height:o.height,opacity:o.opacity,zIndex:Math.round(o.zIndex),textContent:o.type==="text"?o.textContent.slice(0,1e5):"",fontSize:l,isBold:o.type==="text"?o.isBold??!1:void 0,fileName:typeof o.media?.fileName=="string"?o.media.fileName:"",mimeType:typeof o.media?.mimeType=="string"?o.media.mimeType:"",file:null,source:null}}),i=Array.isArray(r.canvas?.strokes)?r.canvas.strokes:[];if(i.length>1e3)throw new Error("The layout contains too many canvas strokes.");let s=i.map((o,a)=>{if(!o||!["draw","erase"].includes(o.mode)||!Array.isArray(o.points))throw new Error(`Canvas stroke ${a+1} is invalid.`);if(!/^#[0-9a-f]{6}$/i.test(o.color||"")||!c(o.size))throw new Error(`Canvas stroke ${a+1} has invalid style data.`);if(o.points.length>1e4)throw new Error(`Canvas stroke ${a+1} has too many points.`);return{mode:o.mode,color:o.color,size:Math.min(100,Math.max(1,o.size)),points:o.points.map(l=>{if(!c(l?.x)||!c(l?.y))throw new Error(`Canvas stroke ${a+1} has invalid points.`);return{x:l.x,y:l.y}})}}),n=c(r.globalOpacity)?r.globalOpacity:1;return{globalOpacity:Math.min(1,Math.max(.1,n)),items:e,strokes:s,zOrder:e.reduce((o,a)=>Math.max(o,a.zIndex),0)}}var f=class{constructor({root:t,state:e,items:i,renderer:s,window:n,onDestroy:o}){this.root=t,this.state=e,this.items=i,this.renderer=s,this.window=n,this.onDestroy=o,this.abortController=new AbortController,this.toolbarPosition={left:8,top:12},this.toolbarDrag=null,this.root.innerHTML=`
      <div id="toolbar" role="toolbar" aria-label="Research overlay tools">
        <span
          id="toolbar-drag-handle"
          class="toolbar-drag-handle"
          role="button"
          tabindex="0"
          aria-label="Drag toolbar"
          title="Drag toolbar"
        >\u283F</span>
        <button id="btn-move" data-mode="move" title="Drag and position items">Move</button>
        <button id="btn-draw" data-mode="draw" title="Freehand drawing">Draw</button>
        <button id="btn-erase" data-mode="erase" title="Erase drawing">Erase</button>
        <input id="draw-color" type="color" value="#ef4444" aria-label="Brush color">
        <input id="brush-size" type="range" min="1" max="20" value="3" aria-label="Brush size">
        <div class="divider"></div>
        <button id="btn-add-text">+ Text</button>
        <label class="btn">+ Media
          <input id="file-input" type="file" accept="image/*,video/*" multiple hidden>
        </label>
        <div class="divider"></div>
        <div class="control-group">
          <label for="global-opacity">Opacity</label>
          <input id="global-opacity" type="range" min="0.1" max="1" step="0.05" value="1">
          <span id="opacity-val">100%</span>
        </div>
        <div class="divider"></div>
        <button id="btn-clickthrough" aria-pressed="false">Click-through: off</button>
        <button id="btn-undo" title="Undo (Ctrl/Cmd+Z)">Undo</button>
        <button id="btn-redo" title="Redo (Ctrl+Y or Cmd+Shift+Z)">Redo</button>
        <button id="btn-export">Export JSON</button>
        <label class="btn">Import JSON
          <input id="layout-input" type="file" accept="application/json,.json" hidden>
        </label>
        <button id="btn-clear" class="danger">Clear</button>
        <button id="btn-close" title="Hide overlay">Close</button>
      </div>
      <div id="status" role="status" aria-live="polite"></div>
      <div id="overlay-layer">
        <canvas id="draw-canvas"></canvas>
      </div>
    `,this.bind(),this.initializeToolbarPosition(),this.unsubscribe=e.subscribe(()=>this.render())}get(t){return this.root.querySelector(`#${t}`)}setStatus(t,e=!1){let i=this.get("status");i.textContent=t,i.style.color=e?"#fecaca":"#fff"}bind(){let t=this.abortController.signal,e=this.get("toolbar-drag-handle");e.addEventListener("pointerdown",i=>this.onToolbarPointerDown(i),{signal:t}),e.addEventListener("pointermove",i=>this.onToolbarPointerMove(i),{signal:t}),e.addEventListener("pointerup",i=>this.onToolbarPointerUp(i),{signal:t}),e.addEventListener("pointercancel",()=>this.endToolbarDrag(),{signal:t}),this.root.querySelectorAll("[data-mode]").forEach(i=>{i.addEventListener("click",()=>this.state.setMode(i.dataset.mode),{signal:t})}),this.get("btn-add-text").addEventListener("click",()=>this.items.addText(),{signal:t}),this.get("file-input").addEventListener("change",i=>{this.items.addFiles(i.target.files),i.target.value=""},{signal:t}),this.get("global-opacity").addEventListener("input",i=>{this.state.setGlobalOpacity(i.target.value)},{signal:t}),this.get("btn-clickthrough").addEventListener("click",()=>this.state.toggleClickThrough(),{signal:t}),this.get("btn-undo").addEventListener("click",()=>this.state.undo(),{signal:t}),this.get("btn-redo").addEventListener("click",()=>this.state.redo(),{signal:t}),this.get("btn-clear").addEventListener("click",()=>{this.state.transaction(i=>{i.items=[],i.strokes=[]}),this.setStatus("Layout cleared.")},{signal:t}),this.get("btn-export").addEventListener("click",()=>this.exportJson(),{signal:t}),this.get("layout-input").addEventListener("change",i=>{this.importJson(i.target.files?.[0]),i.target.value=""},{signal:t}),this.get("btn-close").addEventListener("click",()=>this.onDestroy?.(),{signal:t}),this.window.addEventListener("keydown",i=>this.onKeyDown(i),{signal:t}),this.window.addEventListener("resize",()=>this.clampToolbarPosition(),{signal:t})}initializeToolbarPosition(){let t=this.get("toolbar"),e=this.getToolbarWidth(t),i=Math.round((Math.max(16,this.window.innerWidth)-e)/2);this.setToolbarPosition(i,12)}getToolbarWidth(t){return t.offsetWidth||t.getBoundingClientRect().width||0}getToolbarHeight(t){return t.offsetHeight||t.getBoundingClientRect().height||0}setToolbarPosition(t,e){let i=this.get("toolbar"),s=8,n=this.getToolbarWidth(i),o=this.getToolbarHeight(i),a=Math.max(s,this.window.innerWidth-s-n),l=Math.max(s,this.window.innerHeight-s-o);this.toolbarPosition={left:Math.round(Math.min(Math.max(t,s),a)),top:Math.round(Math.min(Math.max(e,s),l))},i.style.left=`${this.toolbarPosition.left}px`,i.style.top=`${this.toolbarPosition.top}px`,i.style.transform="none"}clampToolbarPosition(){this.setToolbarPosition(this.toolbarPosition.left,this.toolbarPosition.top)}onToolbarPointerDown(t){t.button!==void 0&&t.button!==0||(t.preventDefault(),t.stopPropagation(),this.toolbarDrag={pointerId:t.pointerId,offsetX:t.clientX-this.toolbarPosition.left,offsetY:t.clientY-this.toolbarPosition.top},t.currentTarget.setPointerCapture?.(t.pointerId),t.currentTarget.classList.add("dragging"))}onToolbarPointerMove(t){!this.toolbarDrag||t.pointerId!==this.toolbarDrag.pointerId||(t.preventDefault(),this.setToolbarPosition(t.clientX-this.toolbarDrag.offsetX,t.clientY-this.toolbarDrag.offsetY))}onToolbarPointerUp(t){!this.toolbarDrag||t.pointerId!==this.toolbarDrag.pointerId||(t.currentTarget.releasePointerCapture?.(t.pointerId),this.endToolbarDrag())}endToolbarDrag(){this.toolbarDrag=null,this.get("toolbar-drag-handle").classList.remove("dragging")}onKeyDown(t){if(!this.state.visible||!this.state.active)return;let e=t.composedPath?.()[0]??t.target;if(e?.tagName==="INPUT"||e?.tagName==="TEXTAREA"||e?.isContentEditable)return;let i=t.ctrlKey||t.metaKey;if(t.key==="Escape"){this.state.clickThrough?this.state.toggleClickThrough(!1):this.state.mode!=="move"&&this.state.setMode("move");return}if(!i)return;let s=t.key.toLowerCase();s==="z"&&!t.shiftKey?(t.preventDefault(),this.state.undo()):(s==="y"||s==="z"&&t.shiftKey)&&(t.preventDefault(),this.state.redo())}exportJson(){let t=JSON.stringify(C(this.state),null,2),e=new this.window.Blob([t],{type:"application/json"}),i=this.window.URL.createObjectURL(e),s=this.root.ownerDocument.createElement("a");s.href=i,s.download="research-overlay-layout.json",s.click(),this.window.setTimeout(()=>this.window.URL.revokeObjectURL(i),0),this.setStatus("Layout exported. Local media files are referenced by name, not embedded.")}async importJson(t){if(t)try{let e=await this.readFile(t),i=JSON.parse(e),s=L(i);this.state.transaction(n=>Object.assign(n,s)),this.items.keepItemsInBounds(),this.setStatus(`Imported ${s.items.length} item(s). Local media appears as placeholders until re-added.`)}catch(e){this.setStatus(`Import failed: ${e instanceof Error?e.message:"Invalid JSON file."}`,!0)}}readFile(t){return typeof t.text=="function"?t.text():new Promise((e,i)=>{let s=new this.window.FileReader;s.onload=()=>e(String(s.result)),s.onerror=()=>i(s.error??new Error("Unable to read file.")),s.readAsText(t)})}render(){this.get("btn-move").classList.toggle("active",this.state.mode==="move"),this.get("btn-draw").classList.toggle("active",this.state.mode==="draw"),this.get("btn-erase").classList.toggle("active",this.state.mode==="erase"),this.get("draw-canvas").classList.toggle("drawing-mode",!this.state.clickThrough&&["draw","erase"].includes(this.state.mode)),this.get("overlay-layer").style.opacity=String(this.state.globalOpacity),this.get("global-opacity").value=String(this.state.globalOpacity),this.get("opacity-val").textContent=`${Math.round(this.state.globalOpacity*100)}%`;let t=this.get("btn-clickthrough");t.classList.toggle("active",this.state.clickThrough),t.setAttribute("aria-pressed",String(this.state.clickThrough)),t.textContent=`Click-through: ${this.state.clickThrough?"on":"off"}`,this.get("btn-undo").disabled=!this.state.canUndo,this.get("btn-redo").disabled=!this.state.canRedo}destroy(){this.abortController.abort(),this.unsubscribe()}};var v="research-overlay-host",H={position:"fixed",inset:"0",width:"100vw",height:"100vh",margin:"0",padding:"0",border:"0",zIndex:"2147483647",pointerEvents:"none",isolation:"isolate",contain:"layout style paint",transform:"none",filter:"none",perspective:"none",background:"transparent"},x=class{constructor({document:t=globalThis.document,window:e=globalThis.window}={}){this.document=t,this.window=e,this.destroyed=!1,this.host=t.createElement("div"),this.host.id=v,this.host.setAttribute("popover","manual"),this.host.setAttribute("aria-label","Research overlay"),this.host.setAttribute("role","presentation"),this.applyHostStyles();let i=this.host.attachShadow({mode:"open"}),s=t.createElement("style");s.textContent=I,i.appendChild(s),this.root=t.createElement("div"),i.appendChild(this.root),t.documentElement.appendChild(this.host),this.useTopLayer(),this.state=new y,this.toolbar=new f({root:this.root,state:this.state,items:null,renderer:null,window:e,onDestroy:()=>this.hide()}),this.items=new b({layer:this.root.querySelector("#overlay-layer"),state:this.state,window:e,onStatus:n=>this.toolbar.setStatus(n)}),this.toolbar.items=this.items,this.renderer=new u({canvas:this.root.querySelector("#draw-canvas"),state:this.state,window:e,colorInput:this.root.querySelector("#draw-color"),sizeInput:this.root.querySelector("#brush-size")}),this.toolbar.renderer=this.renderer,this.unsubscribe=this.state.subscribe(()=>this.syncHost()),this.pageHide=()=>this.destroy(),e.addEventListener("pagehide",this.pageHide),this.host.__researchOverlayController=this}syncHost(){this.host.style.setProperty("display",this.state.visible?"block":"none","important"),this.host.dataset.active=String(this.state.active),this.host.dataset.visible=String(this.state.visible)}applyHostStyles(){for(let[t,e]of Object.entries(H))this.host.style.setProperty(t.replace(/[A-Z]/g,i=>`-${i.toLowerCase()}`),e,"important")}useTopLayer(){try{this.host.showPopover?.(),this.host.dataset.topLayer=typeof this.host.showPopover=="function"?"true":"fallback"}catch{this.host.dataset.topLayer="fallback"}}toggle(){return this.state.setVisibility(!this.state.visible),this.state.active}show(){return this.state.setVisibility(!0),!0}hide(){return this.state.setVisibility(!1),!1}destroy(){if(!this.destroyed){this.destroyed=!0,this.state.active=!1,this.window.removeEventListener("pagehide",this.pageHide),this.unsubscribe(),this.renderer.destroy(),this.items.destroy(),this.toolbar.destroy();try{this.host.hidePopover?.()}catch{}delete this.host.__researchOverlayController,this.host.remove()}}};function z(r){return new x(r)}(()=>{let r=document.getElementById(v);if(r?.__researchOverlayController){r.__researchOverlayController.toggle();return}z()})();})();
