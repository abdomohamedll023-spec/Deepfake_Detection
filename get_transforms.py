import json
nb = json.load(open('Yet_another_deepfakeimagedetectionresnet50.ipynb', encoding='utf-8'))
code = [''.join(c['source']) for c in nb['cells'] if c['cell_type'] == 'code']
with open('out.txt', 'w', encoding='utf-8') as f:
    f.write('\n\n---CELL---\n\n'.join([c for c in code if 'transform' in c.lower()]))
