# Japanese stroke data

Geometry derived on 2026-10-08 from the AnimCJK SVG files bundled in
[maxhanzo/AshiatoKaiApp](https://github.com/maxhanzo/AshiatoKaiApp/tree/876b5aca10f2abd9e2f0814904b058b1ebae8358/AshiatoKai/JapaneseStrokes)
at commit `876b5aca10f2abd9e2f0814904b058b1ebae8358`.

AnimCJK copyright 2016–2026 FM-SH / FM&SH:
https://github.com/parsimonhi/animCJK
Derived from MakeMeAHanzi and Arphic PL KaitiM GB / Big5 fonts.

The JSON files are modified representations of the SVG geometry: each file is
named for a decimal Unicode code point. Each file has a modification notice and contains ordered strokes, each with
one or more shape/animation-path components. Original geometry and stroke order
are preserved. CSS, XML markup, and identifiers are omitted. These data changes
were made by the Ashiato Kai web contributors; they are not upstream changes.

Kanji geometry is distributed under the Arphic Public License. Kana and basic
stroke data use LGPL-3.0-or-later, as described in `licenses/COPYING.txt`.
Full license texts are in `licenses/`. The original LGPL SVG source is provided
in `source/svgsJaKana/` and `source/svgsJa/`; the conversion script is `scripts/import-strokes.py` in
the web repository. Recipients may modify and redistribute these data under
their respective licenses.

Regenerate from the pinned mobile checkout:

```sh
python3 scripts/import-strokes.py /path/to/AshiatoKaiApp/AshiatoKai/JapaneseStrokes
```

The importer validates contiguous stroke order and all referenced shape paths.
There are 7,184 characters (7,007 kanji/basic strokes and 177 kana). Unsupported
characters remain visible in the interface with an unavailable-data message.
