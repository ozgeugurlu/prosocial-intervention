#!/usr/bin/env python3
"""
Builds a single self-contained HTML preview of the app in demo mode (sample data,
no Firebase), framed like a phone on desktop. Usage (from the repo root):

    python3 scripts/preview/build-preview.py [output.html] [--fragment] [--split]
"""
import base64, glob, json, os, re, shutil, subprocess, sys, tempfile

root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
out_file = os.path.abspath(args[0] if args else os.path.join(root, 'peach-preview.html'))
build = tempfile.mkdtemp(prefix='peach-preview-')

app_json = os.path.join(root, 'app.json')
original = open(app_json).read()
cfg = json.loads(original)
cfg['expo']['web']['output'] = 'single'
try:
    open(app_json, 'w').write(json.dumps(cfg, indent=2) + '\n')
    env = dict(os.environ, EXPO_PUBLIC_DEMO='1', CI='1')
    subprocess.run(['npx', 'expo', 'export', '--platform', 'web', '--output-dir', build], cwd=root, env=env, check=True)
finally:
    open(app_json, 'w').write(original)

os.chdir(build)
html = open('index.html').read()
js = open(glob.glob('_expo/static/js/web/*.js')[0]).read()
mime = {'.ttf': 'font/ttf', '.png': 'image/png', '.otf': 'font/otf', '.jpg': 'image/jpeg'}

def inline(m):
    f = m.group(1).lstrip('/')
    if not os.path.exists(f):
        return m.group(0)
    data = base64.b64encode(open(f, 'rb').read()).decode()
    return '"data:%s;base64,%s"' % (mime.get(os.path.splitext(f)[1], 'application/octet-stream'), data)

js = re.sub(r'"(/assets/[^"]+)"', inline, js).replace('</script', '<\\/script')
css = ''.join(open(c).read() + '\n' for c in glob.glob('_expo/static/css/*.css'))
html = re.sub(r'<link rel="(preload|stylesheet|icon)"[^>]*>\s*', '', html)
html = re.sub(r'<title>.*?</title>', '<title>PEACH Preview</title>', html)
frame = """
<style>
:root{--page-bg:#0A1730}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--page-bg:#050B18}}
:root[data-theme="dark"]{--page-bg:#050B18}
body{background:var(--page-bg)}
@media (min-width: 520px){
  body{display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}
  #root{max-width:400px;max-height:860px;width:100%;border-radius:36px;overflow:hidden;
        box-shadow:0 24px 60px rgba(20,26,33,.35),inset 0 0 0 1px rgba(255,255,255,.15);border:8px solid #C3CCD9;position:relative;transform:translateZ(0)}
}
</style>"""
html = html.replace('</head>', frame + '<style>' + css + '</style></head>')
prelude = '<script>try{history.replaceState(null,"","/")}catch(e){}</script>'
html = re.sub(r'<script src="[^"]+" defer></script>', lambda m: prelude + '<script>' + js + '</script>', html)
if '--split' in sys.argv:
    # Page + separate app.js (for hosts that cap a single page's size). The script
    # is resolved against the page's real URL before the router moves to "/".
    js_out = os.path.join(os.path.dirname(out_file), 'app.js')
    open(js_out, 'w').write(js.replace('<\\/script', '</script'))
    loader = ("<script>(function(){var src=new URL('app.js',document.baseURI).href;"
              "try{history.replaceState(null,'','/')}catch(e){}"
              "var s=document.createElement('script');s.src=src;document.body.appendChild(s);})();</script>")
    html = re.sub(re.escape(prelude) + r'<script>.*</script>', lambda m: loader, html, flags=re.S)
if '--fragment' in sys.argv:
    # For hosts that supply their own <!doctype>/<html>/<head>/<body> skeleton:
    # keep the title and styles, then the body content.
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
    head = re.sub(r'<meta[^>]*>\s*', '', head)
    html = head + body
open(out_file, 'w').write(html)
shutil.rmtree(build, ignore_errors=True)
print('Wrote %s (%.1f MB)' % (out_file, len(html) / 1e6))
