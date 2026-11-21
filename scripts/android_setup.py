"""`npx cap add android` sonrası Android projesini Robi için ayarlar:
yatay ekran, tam ekran, uygulama adı ve simgeler."""
import os
import re
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
APP = os.path.join(ROOT, 'android', 'app', 'src', 'main')
RES = os.path.join(APP, 'res')
PKG = 'com.robigames.robi'


def edit(path, fn):
    with open(path, encoding='utf-8') as f:
        s = f.read()
    s2 = fn(s)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(s2)
    print('düzenlendi:', os.path.relpath(path, ROOT))


# 1) Sadece yatay ekran
def manifest(s):
    s = re.sub(r'android:screenOrientation="[^"]*"\s*', '', s)
    return s.replace('android:name=".MainActivity"', 'android:name=".MainActivity"\n            android:screenOrientation="sensorLandscape"', 1)
def perms(s):
    for perm in ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS']:
        if perm not in s:
            s = s.replace('</manifest>', f'    <uses-permission android:name="{perm}" />\n</manifest>')
    return s
def links(s):
    if 'robigames' in s:
        return s
    f = '''
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="robi-oda.robigames.workers.dev" android:pathPrefix="/oda/" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="robigames" android:host="oda" />
            </intent-filter>
        </activity>'''
    return s.replace('</activity>', f, 1)
edit(os.path.join(APP, 'AndroidManifest.xml'), lambda s: links(perms(manifest(s))))

# 2) Uygulama adı
def strings(s):
    s = re.sub(r'<string name="app_name">.*?</string>', "<string name=\"app_name\">Robi\\'nin Macerası</string>", s)
    s = re.sub(r'<string name="title_activity_main">.*?</string>', "<string name=\"title_activity_main\">Robi\\'nin Macerası</string>", s)
    return s
edit(os.path.join(RES, 'values', 'strings.xml'), strings)

# 3) Tam ekran (durum çubuğu ve gezinme çubuğu gizli)
java_dir = os.path.join(APP, 'java', *PKG.split('.'))
with open(os.path.join(java_dir, 'MainActivity.java'), 'w', encoding='utf-8') as f:
    f.write('''package com.robigames.robi;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideBars();
    }

    private void hideBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
''')
print('yazıldı: MainActivity.java (tam ekran)')

# 4) Simgeler
icon = Image.open(os.path.join(ROOT, 'resources', 'icon.png')).convert('RGBA')
fg_src = Image.open(os.path.join(ROOT, 'resources', 'icon-foreground.png')).convert('RGBA')
fg = Image.new('RGBA', fg_src.size, (0, 0, 0, 0))
inner = fg_src.resize((int(fg_src.width * .78), int(fg_src.height * .78)), Image.LANCZOS)
fg.paste(inner, ((fg.width - inner.width) // 2, (fg.height - inner.height) // 2), inner)
for d, legacy, fgs in [('mdpi', 48, 108), ('hdpi', 72, 162), ('xhdpi', 96, 216), ('xxhdpi', 144, 324), ('xxxhdpi', 192, 432)]:
    folder = os.path.join(RES, f'mipmap-{d}')
    os.makedirs(folder, exist_ok=True)
    icon.resize((legacy, legacy), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher.png'))
    icon.resize((legacy, legacy), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher_round.png'))
    fg.resize((fgs, fgs), Image.LANCZOS).save(os.path.join(folder, 'ic_launcher_foreground.png'))
bg = os.path.join(RES, 'values', 'ic_launcher_background.xml')
if os.path.exists(bg):
    edit(bg, lambda s: re.sub(r'#[0-9A-Fa-f]{6,8}', '#FFD166', s))
print('simgeler hazır')
