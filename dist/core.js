(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ReceiptCore=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const normalize=t=>String(t||'').normalize('NFKC').replace(/(?<=\d)[ \t]*[,，][ \t]*(?=\d)/g,',').replace(/(?<=\d)\.(?=\d{3}(?:\D|$))/g,',');
const compact=t=>t.replace(/\s/g,'');
const number=t=>{const s=String(t).replace(/[,₩￦원\s]/g,'');return /^\d{1,10}$/.test(s)&&Number(s)>0?Number(s):null};
function validDate(y,m,d){const x=new Date(Date.UTC(y,m-1,d));return x.getUTCFullYear()===y&&x.getUTCMonth()===m-1&&x.getUTCDate()===d}
function dateName(s){s=String(s||'').trim();let y=2000,m,d;if(/^\d{4}$/.test(s)){m=+s.slice(0,2);d=+s.slice(2)}else{const a=s.match(/^(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})$/);if(!a)throw Error('날짜를 1022 또는 2026-10-22 형식으로 입력해 주세요.');[y,m,d]=a.slice(1).map(Number)}if(!validDate(y,m,d))throw Error('실제 존재하는 날짜를 입력해 주세요.');return String(m).padStart(2,'0')+String(d).padStart(2,'0')}
function filename(date,amount,original){const n=number(amount);if(!n||n>9999999999)throw Error('최종 결제금액을 0보다 큰 정수로 입력해 주세요.');const ext=(String(original).match(/\.(jpe?g|png|pdf)$/i)||[])[0];if(!ext)throw Error('JPG, JPEG, PNG, PDF만 지원합니다.');return `${dateName(date)}_${n}${ext.toLowerCase()}`}
function expense({cell,category,representative,client,hasClient,people}){const p=Number(people);if(!Number.isInteger(p)||p<1||p>999)throw Error('총 인원을 1~999명으로 입력해 주세요.');if(!cell?.trim())throw Error('부서명을 입력해 주세요.');if(!['커피비','식사비'].includes(category))throw Error('커피비 또는 식사비를 선택해 주세요.');if(hasClient&&!client?.trim())throw Error('클라이언트 이름을 입력해 주세요.');let staff=p-(hasClient?1:0),parts=[];if(staff){if(!representative?.trim())throw Error('대표자 이름을 입력해 주세요.');parts.push(representative.trim()+(staff>1?` 외 ${staff-1}인`:''))}if(hasClient)parts.push(`클라이언트: ${client.trim()}`);return `${cell.trim()} ${category} (${parts.join(' / ')})`}

function parseItems(lines){
 const items=[];let inTable=false,ended=false,pending='',header='';
 const meta=/사업자|대표자|대표:|전화번호|카드번호|승인번호|주문번호|대기번호|영수증번호|가맹점번호|고객연락처|주소|결제일시|주문일시|승인일시|거래일자|결제카드|결제정보|승인상태|할부기간|고객용|매입사제출|단말기|승인상태|가맹점상세|개인법인/;
 const stop=/^(?:과세(?:물품|금액)|면세(?:물품|금액)|부가세|물품금액|물품가액|공급가|합계|소계|주문금액|총액|총금액|총합계|승인금액|결제금액|받을금액|받은금액|거스름돈|할인금액|total|subtotal|cash|change|tax|vat|servicecharge)/i;
 const option=/^[ㄴᄂ└┗↳]|^[-–]\s*\(|핫\/?아이스|원두선택|샷선택|시럽추가|변경.*필요시|필요시.*선택|우유변경|우유옵션|덜달게|얼음컵|물적게옵션|샷추가|사이즈업|보증금|포장비|배달비|봉투|수저|소스추가/;
 const known=/커피|라떼|콜드|브루잉|아메리카노|주스|쥬스|케이크|팔미에|파운드|쿠키|돈까스|카츠|정식|찌개|국밥|김밥|볶음|불고기|삼겹|우동|초밥|비빔|냉면|덮밥|샌드위치|샐러드|milk|coffee|tea|rice|noodle/i;
 for(let index=0;index<lines.length;index++){
  let line=lines[index].trim(),c=compact(line);
  if(/(?:품명|상품명|메뉴명|item|description).*(?:수량|단가|가격|금액|qty|price|amount)/i.test(c)||/수량.*(?:가격|금액)/.test(c)){inTable=true;ended=false;header=c;pending='';continue}
  if(stop.test(c)){inTable=false;ended=true;pending='';continue}
  if(meta.test(c)||/^[-_=\s]{3,}$/.test(c)){pending='';continue}
  if(option.test(c)||/취소|반품|환불|사용포인트|누적포인트|보유포인트|포인트잔액/.test(c)){pending='';continue}
  if(/^(?:포인트|적립|쿠폰|이벤트|합산|할인|이용안내|감사합니다|주문서|영수증)/.test(c)){pending='';continue}
  if(ended)continue;
  if(header&&header.search(/수량|qty/i)>Math.max(header.search(/금액|amount/i),header.search(/가격|price/i),header.search(/단가/i))){line=line.replace(/(\d[\d,]*\s*원?)\s+(\d{1,3})\s*$/, '$2 $1')}
  line=line.replace(/^[\s:;|_]+/,'').replace(/[\s|_;:]+$/,'');
  // A thousands separator remains evidence even when the currency glyph is misread.
  line=line.replace(/(\s(?:\d{1,3}|[Il|ㅣᅵ])\s+)(\d{1,3})[ \t]+(\d{3})(\s*원[!?]*\s*)$/, '$1$2,$3$4');
  const tail=line.match(/(?<![\d,])(?:[₩￦]\s*)?(\d{1,3}(?:,\d{3})+|\d{2,8})\s*[원왼윙웬₩￦%!?|._;:]*\s*$/);
  if(!tail){if((inTable||known.test(c))&&/[가-힣A-Za-z]/.test(line)&&line.length<90&&!/\d{2}[-/.]\d{2}|\d{3}[- ]\d{3}/.test(line))pending=line;continue}
  const total=number(tail[1]);if(!total||total<100){pending='';continue}
  let left=line.slice(0,tail.index).trim().replace(/(?:\s*\d+\s*%)$/,'').trim();
  const tokens=left.split(/\s+/);const values=[];
  while(tokens.length){const raw=tokens.at(-1).replace(/^[_^~]+|[_^~]+$/g,'');let v=null;if(/^[Il|ㅣᅵ]$/.test(raw))v=1;else if(/^\d[\d,]*(?:개|잔|인분|x|X)?$/.test(raw))v=Number(raw.replace(/[,개잔인분xX]/g,''));if(v===null||!Number.isFinite(v))break;tokens.pop();values.unshift(v)}
  let name=tokens.join(' ').trim(),qty='',unit=0,basis='수량 미인식 · 확인 필요';
  if(!name&&pending)name=pending;
  if(!name||!/[가-힣A-Za-z]/.test(name)){pending='';continue}
  name=name.replace(/^\d{1,4}[.)]?\s+/,'').replace(/^[\s_*:;|.]+/,'').replace(/[\s_^~]+$/,'');
  if(meta.test(compact(name))||option.test(compact(name))||name.length<2){pending='';continue}
  if(values.length>=3){if(header&&header.indexOf('수량')<header.indexOf('단가')){qty=values[0];unit=values[1]}else{unit=values[0];qty=values[1]}basis='단가·수량·할인 열'}
  else if(values.length===2){if(values[0]>=100){unit=values[0];qty=values[1]}else if(values[1]>=100){qty=values[0];unit=values[1]}else{qty=values[1]}basis=unit&&unit*qty===total?'단가 × 수량 일치':'수량 열 확인'}
  else if(values.length===1&&values[0]>=1&&values[0]<=999){qty=values[0];basis='수량·가격 열'}
  if(!Number.isInteger(qty)||qty<1||qty>999)qty='';
  // Without a header, require quantity evidence or an actual product-like row.
  if(!inTable&&!values.length&&!known.test(compact(name))){pending='';continue}
  const cc=compact(name),isOption=/^(?:옵션|추가샷|추가시럽)|시럽추가|오트밀크변경|토핑추가/.test(cc),shared=/케이크|파운드|팔미에|쿠키|디저트|사이드|세트|모둠|모듬/.test(cc);
  items.push({id:items.length+1,name,qty,total,include:!isOption,basis:isOption?'옵션 제외':qty===''?basis:shared?'공유 메뉴 확인':basis,shared,lineIndex:index});pending='';
 }
 return items;
}

function parse(text){
 text=normalize(text);const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const dates=[],amounts=[],items=[],notices=[];let category='',merchant='',inTable=false,pending='',header='';
 for(let i=0;i<lines.length;i++){
  const line=lines[i],c=compact(line);let match;
  if(/이벤트|포인트|적립|쿠폰|프로모션|할인|스탬프|리워드|멤버십|행사|응모|point|coupon|reward|event/i.test(c))notices.push(line);
  if(/점포명|가맹점명|상호명|상호:/.test(c)){merchant=line.replace(/^.*?(?:점\s*포\s*명|가\s*맹\s*점\s*명|상\s*호\s*명|상호)\s*[:：]?\s*/,'')}
  const ds=line.replace(/\s*[년월]\s*/g,'-').replace(/일/g,'');
  match=ds.match(/(?<!\d)(20\d{2})[./\-\s]+(0?[1-9]|1[0-2])[./\-\s]+(0?[1-9]|[12]\d|3[01])(?!\d)/)||ds.match(/(?<!\d)(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?!\d)/)||ds.match(/(?<!\d)(\d{2})[./\- ]+(0?[1-9]|1[0-2])[./\- ]+(0?[1-9]|[12]\d|3[01])(?!\d)/);
  if(!match&&/승인일시/.test(c)){const a=c.match(/승인일시[:：]?(\d{2})(\d{2})(\d{2})\d{6,8}/);if(a)match=a}
  if(match){let y=+match[1];if(y<100)y+=2000;const m=+match[2],d=+match[3];if(validDate(y,m,d)){dates.push({value:`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,score:/이벤트|유효|기간|만료|행사/.test(c)?-10:/결제일시|거래일|매출일|승인일|판매일|발행일/.test(c)?10:/주문일/.test(c)?5:1})}}
  if(!/할인|포인트|적립|거스름|부가세|과세|면세|공급가|물품가|받은금액|봉사료/.test(c)){
   let score=0;const labels=[[/최종결제금액|실결제금액|[승슴]인금액|결제금액/,120],[/받을금액|청구금액|총결제/,115],[/총액|총금액|총합계/,100],[/합계금액|합계|TOTAL/i,95],[/주문금액/,70]];
   for(const [re,s] of labels){if(re.test(c)){score=s;break}}
   if(!score&&/[스승슴][인히]금액/.test(c)&&lines.slice(Math.max(0,i-8),i).some(x=>/카드|승인번호/.test(compact(x))))score=110;
   if(score){const numeric=[...line.matchAll(/(?<![\d,\-/:])(?:\d{1,3}(?:,\d{3})+|\d{2,10})(?![\d,\-/:])/g)].map(x=>number(x[0])).filter(Boolean);if(!numeric.length&&lines[i+1]&&/^[₩￦\s]*\d[\d,]*\s*원?$/.test(lines[i+1]))numeric.push(number(lines[i+1]));const n=numeric.find(x=>x>=100)||numeric[0];if(n)amounts.push({value:n,score,line})}
  }
 }
 for(let i=0;i<lines.length;i++){if(/[승슴]인일시/.test(compact(lines[i]))){for(const t of [lines[i],lines[i-1]||'',lines[i+1]||'']){const a=t.match(/(?<!\d)(\d{2})(\d{2})(\d{2})\d{6,8}(?!\d)/);if(a){const y=2000+Number(a[1]),m=+a[2],d=+a[3];if(validDate(y,m,d))dates.push({value:`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`,score:20})}}}}
 const all=compact(text);
 if(/커피|아메리카노|라떼|카푸치노|콜드브루|브루잉|에스프레소|카페모카|타르틴|스타벅스|쥬스|주스|coffee|latte|americano/i.test(all))category='커피비';
 else if(/식당|푸드홀|돈까스|돈카츠|카츠|정식|국밥|찌개|볶음밥|백반|불고기|비빔밥|삼겹|칼국수|냉면|우동|초밥|김밥|햄버거|떡볶이/.test(all))category='식사비';
 const parsedItems=parseItems(lines);items.push(...parsedItems);
 const sum=items.filter(x=>x.include).reduce((s,x)=>s+x.qty,0);dates.sort((a,b)=>b.score-a.score);amounts.sort((a,b)=>b.score-a.score);
 const receiptType=!items.length&&/결제정보|승인상태|개인법인명의|결제카드/.test(all)?'card-statement':'receipt';
 if(!amounts.length&&receiptType==='card-statement'){for(const line of lines.slice(0,8)){const m=line.match(/^\s*[₩￦]?\s*(\d[\d,]*)\s*원(?:\s|$)/);if(m){amounts.push({value:number(m[1]),score:90,line});break}}}
 const warnings=[];if(items.some(x=>x.include&&!Number.isInteger(x.qty)))warnings.push('상품은 발견했지만 수량이 읽히지 않은 행이 있어요. 빈 수량을 확인해 주세요.');if(receiptType==='card-statement')warnings.push('품목 목록이 없는 카드 결제내역이에요. 총 인원은 직접 입력해 주세요.');if(!dates.length)warnings.push('날짜를 찾지 못했어요. 결제일을 입력해 주세요.');if(!amounts.length)warnings.push('최종 결제금액을 확인해 주세요.');if(!sum)warnings.push('품목 수량을 찾지 못했어요. 인원을 직접 입력하거나 품목을 추가해 주세요.');if(items.some(x=>x.shared))warnings.push('케이크·세트 등 공유 메뉴가 포함되어 있어요. 실제 인원과 대조해 주세요.');if(!category)warnings.push('커피비 또는 식사비를 선택해 주세요.');
 if(dates.length&&new Set(dates.filter(x=>x.score>=0).map(x=>x.value)).size>1)warnings.push('서로 다른 날짜가 읽혔어요. 실제 결제일을 확인해 주세요.');
 if(dates[0]&&Number(dates[0].value.slice(0,4))>new Date().getFullYear()+1)warnings.push('결제 연도가 미래로 읽혔어요. 원본을 확인해 주세요.');
 const preferred=amounts[0];if(preferred&&items.length&&items.filter(x=>x.include).reduce((s,x)=>s+x.total,0)!==preferred.value)warnings.push('인식한 품목 금액과 결제금액이 달라요. 누락 품목·추가 옵션·할인 여부를 확인해 주세요.');if(preferred&&amounts.some(x=>x.score>=95&&x.value!==preferred.value))warnings.push('합계와 승인금액이 달라요. 실제 결제금액을 확인해 주세요.');
 return {date:dates[0]?.value||'',amount:preferred?.value||'',amountBasis:preferred?.line||'',people:items.some(x=>x.include&&!Number.isInteger(x.qty))?'':sum||'',receiptType,category,merchant,items,notices:[...new Set(notices)],warnings,text};
}
function uniqueNames(names){const used=new Set();return names.map(name=>{const dot=name.lastIndexOf('.'),stem=name.slice(0,dot),ext=name.slice(dot);let out=name,n=1;while(used.has(out.toLowerCase()))out=`${stem}_${n++}${ext}`;used.add(out.toLowerCase());return out})}
return {parse,expense,filename,dateName,number,uniqueNames,normalize,parseItems};
});
