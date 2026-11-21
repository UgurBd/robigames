# Robi'nin Macerası 🤖

Minik insansı robot Robi'nin 3D macera oyunu. Eğitim Bahçesi, Büyülü Orman ve Dev Oda dünyaları; ateş, su, uçuş ve avcı kostümleri.

## APK'yı telefona / tablete kurmak

1. Telefonda bu sayfayı açın: **Releases → "Robi'nin Macerası — son sürüm"**
2. `RobininMacerasi.apk` dosyasına dokunup indirin.
3. Açın. Android "bilinmeyen kaynaklardan yükleme" izni isterse, tarayıcıya bu izni verin.
4. Kurulduktan sonra ana ekranda **Robi'nin Macerası** simgesi çıkar. Oyun yatay ve tam ekran açılır, internet gerekmez.

Yeni sürümler eskisinin üstüne kurulur, kayıtlı ilerleme silinmez.

## Nasıl çalışıyor?

- `www/` → oyunun kendisi (HTML + Three.js). Tarayıcıda `www/index.html` açılarak da test edilebilir.
- `main` dalına her gönderimde GitHub Actions oyunu [Capacitor](https://capacitorjs.com) ile Android uygulamasına çevirip APK derler ve **Releases** sayfasına koyar.
- `scripts/android_setup.py` → yatay ekran, tam ekran, uygulama adı ve simgeleri ayarlar.
- `keystore/debug.keystore` → sadece test sürümleri için ortak imza anahtarı (her güncelleme aynı imzayla gelsin diye). Google Play'e çıkarken buraya değil, gizli bir anahtara geçilecek.

## Güncellemeler

Uygulama her açılışta GitHub'daki `www/version.json` ile kendi sürümünü karşılaştırır. Yeni sürüm varsa menüde **"🆕 Yeni sürüm hazır — İndir"** butonu çıkar; dokununca yeni APK iner, eskisinin üstüne kurulur (ilerleme silinmez).
Yeni sürüm yayınlarken `www/version.json` içindeki `v` sayısı bir artırılır.
