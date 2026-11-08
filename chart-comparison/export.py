"""Export the notebook's answered-trial choice shares; no database access."""
import csv,json
from pathlib import Path
root=Path(__file__).resolve().parents[2]/'ai-dilemmas'
ds=json.loads((root/'dilemmas.json').read_text())['dilemmas']
rows=[r for r in csv.DictReader((root/'analysis/data/exp1_answers.csv').open()) if r['status']=='answered' and r['model']!='z-ai/glm-5.3-flash']
models=sorted({r['model'] for r in rows})
out=[]
for d in ds:
 for m in models:
  for f in ['classic','disguised']:
   rs=[r for r in rows if r['dilemma_id']==d['id'] and r['model']==m and r['framing']==f]
   if not rs: continue
   counts={o['label']:sum(r['choice_id']==o['id'] for r in rs) for o in d['options']}
   assert sum(counts.values())==len(rs)
   out.append(dict(model=m.split('/',1)[1],dilemma=d['id'],framing=f,n=len(rs),**{k:v/len(rs) for k,v in counts.items()}))
Path(__file__).with_name('data.json').write_text(json.dumps(dict(models=[m.split('/',1)[1] for m in models],dilemmas=ds,rows=out),indent=2))
print(len(out),'model/dilemma/framing groups exported')
