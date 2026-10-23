(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.ReceiptVision=factory(root.ReceiptCore)})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
function nativeLines(data){const out=[];for(const b of data.blocks||[])for(const p of b.paragraphs||[])for(const l of p.lines||[])if(l.text?.trim())out.push(l);return out.sort((a,b)=>a.bbox.y0-b.bbox.y0)}
function rows(data){
 const lines=nativeLines(data),angles=lines.filter(l=>l.baseline&&l.baseline.x1-l.baseline.x0>120).map(l=>(l.baseline.y1-l.baseline.y0)/(l.baseline.x1-l.baseline.x0)).filter(v=>Math.abs(v)<.15).sort((a,b)=>a-b),slope=angles.length?angles[Math.floor(angles.length/2)]:0;
 const words=lines.flatMap(l=>l.words||[]).filter(w=>w.text?.trim()).map(w=>({...w,y:(w.bbox.y0+w.bbox.y1)/2-slope*(w.bbox.x0+w.bbox.x1)/2,h:w.bbox.y1-w.bbox.y0})).sort((a,b)=>a.y-b.y||a.bbox.x0-b.bbox.x0);if(!words.length)return data.text||'';
 const grouped=[];for(const w of words){let group=grouped.at(-1);if(!group||Math.abs(group.y-w.y)>Math.max(6,Math.min(group.h,w.h)*.7)){group={y:w.y,h:w.h,words:[]};grouped.push(group)}group.words.push(w);group.y=group.words.reduce((s,w)=>s+w.y,0)/group.words.length}
 return grouped.map(g=>g.words.sort((a,b)=>a.bbox.x0-b.bbox.x0).map(w=>w.text).join(' ')).join('\n');
}
function tableBounds(data,width,height){
 const lines=nativeLines(data),compact=t=>C.normalize(t).replace(/\s/g,'');
 const header=lines.find(l=>/(?:품명|상품명|메뉴명|item|description)/i.test(compact(l.text))||/수량.*(?:가격|금액)/.test(compact(l.text)));
 if(!header)return null;const lineHeight=Math.max(18,header.bbox.y1-header.bbox.y0);
 const footer=lines.find(l=>l.bbox.y0>header.bbox.y1+lineHeight&&/(?:과세|면세|부가세|물품금액|합계(?:금액)?|주문금액|총액|결제금액|받을금액|subtotal|total|tax|vat)/i.test(compact(l.text).replace(/^[^가-힣A-Za-z]+/,'')));
 if(!footer)return null;const y=Math.max(0,header.bbox.y1-4),bottom=Math.min(height,footer.bbox.y0+2);
 if(bottom-y<lineHeight||bottom-y>height*.8)return null;
 return {x:0,y,w:width,h:bottom-y,header,footer};
}
function itemScore(info){const inc=info.items.filter(x=>x.include),complete=inc.filter(x=>Number.isInteger(x.qty)&&x.qty>0),sum=inc.reduce((s,x)=>s+x.total,0);return complete.length*10+inc.length*2+(info.amount&&sum===info.amount?15:info.amount&&sum>0&&sum<info.amount?8*sum/info.amount:0)-inc.filter(x=>x.qty==='').length*3}
function bestText(data){const candidates=[data.text||'',rows(data)];return candidates.map(text=>({text,info:C.parse(text)})).sort((a,b)=>itemScore(b.info)-itemScore(a.info))[0].text}
function compose(main,bounds,table){const lines=nativeLines(main),before=lines.filter(l=>l.bbox.y0<bounds.header.bbox.y0).map(l=>l.text.trim()),after=lines.filter(l=>l.bbox.y0>=bounds.footer.bbox.y0-2).map(l=>l.text.trim());return [...before,'품명 수량 가격',table,...after].join('\n')}
async function recognize(worker,canvas,{makeCanvas,onStage=()=>{},input=c=>c}={}){
 onStage('영수증 전체를 읽고 있어요…');const full=await worker.recognize(input(canvas),{tessedit_pageseg_mode:'6',rotateAuto:false},{blocks:true});
 let chosen=bestText(full.data),info=C.parse(chosen),passes=1;const bounds=tableBounds(full.data,canvas.width,canvas.height);
 if(bounds){onStage('상품 표를 확대해 누락을 확인하고 있어요…');const scale=Math.min(2,Math.max(1,850/bounds.w)),table=makeCanvas(Math.round(bounds.w*scale),Math.round(bounds.h*scale)),ctx=table.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,table.width,table.height);ctx.drawImage(canvas,bounds.x,bounds.y,bounds.w,bounds.h,0,0,table.width,table.height);
 try{
 const result=await worker.recognize(input(table),{tessedit_pageseg_mode:'6',rotateAuto:false},{blocks:true});passes++;const text=compose(full.data,bounds,bestText(result.data)),candidate=C.parse(text);if(itemScore(candidate)>=itemScore(info)){chosen=text;info=candidate}
 // A second segmentation mode helps rows with a wrapped product name or narrow columns.
 const sum=info.items.filter(x=>x.include).reduce((s,x)=>s+x.total,0);if(!info.items.length||info.items.some(x=>x.qty==='')||(info.amount&&sum!==info.amount)){
 const alternate=await worker.recognize(input(table),{tessedit_pageseg_mode:'4',rotateAuto:false},{blocks:true});passes++;const altText=compose(full.data,bounds,bestText(alternate.data)),alt=C.parse(altText);if(itemScore(alt)>itemScore(info)){chosen=altText;info=alt}
 }
 }finally{table.width=table.height=1}
 }
 return {text:chosen,confidence:full.data.confidence,passes,tableDetected:!!bounds};
}
return {nativeLines,rows,tableBounds,itemScore,bestText,recognize};
});
