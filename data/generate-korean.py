"""Original synthetic fixtures inspired by public receipt schemas, not copied images."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent/'korean-synthetic'
cases=[
 ('cafe-options','카페 옵션형','품명 수량 가격\n딸기바나나주스 1 4,900원\n아메리카노 1 2,900원\nㄴ(핫/아이스)HOT 0원\n바나나파운드케이크 1 5,800원\n조각)\n애플주스 1 5,900원',4,4,19500),
 ('unit-qty-total','식당 단가·수량형','상품명 단가 수량 금액\n수육정식 9,000 3 27,000',1,3,27000),
 ('wrapped-four-columns','푸드홀 줄바꿈형','상품명 단가 수량 할인 금액\n왕돈까스\n12,300 1 0 12,300\n수제안심카츠\n13,800 1 0 13,800',2,2,26100),
 ('barcode','마트 바코드형','상품명 단가 수량 금액\n8800123456789 초코우유 2,800 2 5,600\n8800987654321 치즈빵 3,000 1 3,000',2,3,8600),
 ('quantity-last','가격 뒤 수량형','상품명 가격 수량\n밀크티 4,500 2\n핫초코 5,000 1',2,3,14000),
 ('qty-unit-discount','수량·단가·할인형','품명 수량 단가 할인 금액\n샌드위치 2 6,000 0 12,000',1,2,12000),
 ('quantity-units','잔·개 단위형','품명 수량 금액\n말차스무디 2잔 10,000원\n바게트 1개 4,000원',2,3,14000),
 ('new-product','새로운 메뉴명','품명 수량 가격\n루이보스프라페 2 11,000원\n자몽허니블랙티 1 5,500원',2,3,16500),
 ('missing-header','표 머리글 누락형','루이보스프라페 2 11,000원\n자몽허니블랙티 1 5,500원',2,3,16500),
 ('missing-quantity','수량 미인식형','품명 수량 가격\n루이보스프라페 11,000원\n자몽허니블랙티 1 5,500원',2,'',16500),
 ('refund','취소·반품 제외형','품명 수량 가격\n보리차 2 4,000원\n취소 바닐라밀크 1 5,000원',1,2,4000),
 ('discount-points','할인·적립형','품명 수량 가격\n포케 2 20,000원\n할인금액 3,000원\n사용포인트 1,000\n적립포인트 160',1,2,16000),
]
records=[]
for ident,title,body,item_count,people,amount in cases:
 for variant,sep in enumerate([',','.','plain']):
  text=f'영수증 테스트 / {title}\n거래일시 2026-10-22 12:30:00\n{body}\n합계금액 {amount:,}원\n승인금액 {amount:,}원'
  if sep=='.':text=text.replace(',','.')
  elif sep=='plain':text=text.replace(',','')
  records.append({'id':ident+'-'+str(variant),'type':title,'synthetic':True,'license':'CC0-1.0','source_schema':['https://api.ncloud-docs.com/docs/ai-application-service-ocr-ocrdocumentocr-receipt','https://docs.tosspayments.com/guides/v2/learn/payment-results'],'text':text,'expected':{'date':'2026-10-22','amount':amount,'people':people,'items':item_count}})
records.append({'id':'digital-card-no-items','type':'품목 없는 모바일 결제내역','synthetic':True,'license':'CC0-1.0','text':'카페 결제내역\n15,800원 금액 상세\n결제 정보\n거래 일자 26. 9. 1 · 16:07:40\n결제 카드 MC-P\n승인상태 정상','expected':{'date':'2026-09-01','amount':15800,'people':'','items':0}})
(root/'cases.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
from PIL import Image,ImageDraw,ImageFont
fontfile=Path('/workspace/scratch/5bfb294897c4/receipt-qa/NotoSansCJKkr-Regular.otf')
if fontfile.exists():
 font=ImageFont.truetype(str(fontfile),24)
 for rec in records[::3]:
  lines=rec['text'].splitlines();im=Image.new('RGB',(850,70+len(lines)*42),'white');d=ImageDraw.Draw(im)
  for i,line in enumerate(lines):d.text((35,30+i*42),line,font=font,fill='#161616')
  im.save(root/'images'/(rec['id']+'.png'))
print(len(records),'original synthetic text fixtures; generated images',len(list((root/'images').glob('*.png'))))
