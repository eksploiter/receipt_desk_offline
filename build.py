from pathlib import Path
import json,base64
root=Path(__file__).resolve().parent
mods=root/'vendor/runtime'
b64=lambda p:base64.b64encode(p.read_bytes()).decode()
assets={'ocrCore':b64(mods/'tesseract.js-core/tesseract-core-lstm.wasm.js'),'ocrWorker':b64(mods/'tesseract.js/dist/worker.min.js'),'kor':b64(root/'vendor/kor-best-int.traineddata.gz'),'eng':b64(root/'vendor/eng.traineddata.gz'),'pdfMain':b64(mods/'pdfjs-dist/build/pdf.min.mjs'),'pdfWorker':b64(mods/'pdfjs-dist/build/pdf.worker.min.mjs')}
# Vendor license texts accompany all distributions, including the standalone HTML.
licenses={name:(mods/path).read_text() for name,path in [('Tesseract.js','tesseract.js/LICENSE.md'),('Tesseract.js-core','tesseract.js-core/LICENSE'),('PDF.js','pdfjs-dist/LICENSE')]}
assets['licenses']=licenses
text=(root/'template.html').read_text().replace('__ASSETS__',json.dumps(assets,separators=(',',':')).replace('<','\\u003c'))
for marker,path in [('__TESSERACT__',mods/'tesseract.js/dist/tesseract.min.js'),('__CORE__',root/'dist/core.js'),('__LAYOUT__',root/'dist/layout.js'),('__APP__',root/'dist/app.js')]:
 code=path.read_text().replace('</script','<\\/script')
 text=text.replace(marker,code)
(root/'dist/index.html').write_text(text)
print('Standalone HTML',len(text.encode()),'bytes')
