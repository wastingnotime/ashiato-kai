"""Extract AnimCJK geometry: python3 scripts/import-strokes.py <JapaneseStrokes>.
Output is derived data under Arphic / LGPL licenses; see public/strokes.
"""
import json
import re
import sys
from pathlib import Path
import xml.etree.ElementTree as ET

out = Path('public/strokes')
out.mkdir(parents=True, exist_ok=True)
ns = {'s': 'http://www.w3.org/2000/svg'}
count = 0
for folder in ('svgsJa', 'svgsJaKana'):
    for source in sorted((Path(sys.argv[1]) / folder).glob('*.svg')):
        if not source.stem.isdecimal():
            continue
        root = ET.parse(source).getroot()
        shapes = {p.attrib['id']: p.attrib['d'] for p in root.findall('s:path', ns) if 'id' in p.attrib}
        clips = {c.attrib['id']: c.find('s:use', ns).attrib['href'][1:] for c in root.findall('s:defs/s:clipPath', ns)}
        groups = {}
        for p in root.findall('s:path', ns):
            if 'clip-path' not in p.attrib:
                continue
            order = int(re.search(r'--d:\s*(\d+)s', p.attrib['style'])[1])
            clip = p.attrib['clip-path'][5:-1]
            groups.setdefault(order, []).append({'shape': shapes[clips[clip]], 'line': p.attrib['d']})
        assert groups and sorted(groups) == list(range(1, len(groups) + 1)), source
        (out / (source.stem + '.json')).write_text(json.dumps({'notice': 'AnimCJK 2016-2026 FM-SH / FM&SH. Modified 2026-10-08 by Ashiato Kai web contributors: converted SVG paths and stroke order into JSON, omitting SVG markup and animation CSS. See /strokes/README.md and /strokes/licenses/.', 'license': 'LGPL-3.0-or-later' if 'Arphic Public License' not in source.read_text() else 'Arphic Public License', 'strokes': [groups[k] for k in sorted(groups)]}, separators=(',', ':')) + '\n')
        count += 1
print(f'Imported and validated {count} characters')
