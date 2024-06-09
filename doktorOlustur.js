const { Client } = require('pg');
const fs = require('fs');
const yoll = require('path');

// PostgreSQL bağlantı bilgileri
const clientİstemcii = new Client({
  user: 'postgres',  // Veritabanı kullanıcı adı
  host: 'localhost',  // Veritabanı host adresi
  database: 'prolab',  // Veritabanı adı
  password: '123',  // Veritabanı şifresi
  port: 5432,  // Veritabanı portu
});

async function randommVeriiAll(dizii) {
  return dizii[Math.floor(Math.random() * dizii.length)];
}

async function dosyaYolunuAll(dosyaaYoluu) {
  return new Promise((resolve, reject) => {
    fs.readFile(dosyaaYoluu, 'utf8', (err, data) => {
      if (err) reject(err);
      resolve(data.split('\n').filter(Boolean));
    });
  });
}

async function idKontroluu() {
  let doktorid;
  let essizMi = false;

  while (!essizMi) {
    // 10000 ile 99999 arasında rastgele bir doktorid oluştur
    doktorid = Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
    // Veritabanında bu doktorid'nin var olup olmadığını kontrol et
    const sonuucc = await clientİstemcii.query('SELECT COUNT(*) FROM doktorlar WHERE doktorid = $1', [doktorid]);
    // Eğer bu doktorid yoksa essizMi = true yap ve döngüden çık
    if (sonuucc.rows[0].count == 0) {
      essizMi = true;
    }
  }

  return doktorid;
}

async function veriiTabaniinaaKaydeett(doktor) {
  const sqlSorguusuu = `
    INSERT INTO doktorlar(doktorid, ad, soyad, uzmanlikalani, calistigihastane)
    VALUES($1, $2, $3, $4, $5)
  `;
  await clientİstemcii.query(sqlSorguusuu, [
    doktor.doktorid,
    doktor.ad,
    doktor.soyad,
    doktor.uzmanlikalani,
    doktor.calistigiHastane,
  ]);
  console.log(`Doktor kaydedildi: ${doktor.doktorid} - ${doktor.ad} ${doktor.soyad}`);
}

async function randommDoktorrOlusturr(belirtilennSayii) {
  await clientİstemcii.connect();

  try {
    const adListesii = await dosyaYolunuAll(yoll.join(__dirname, 'ad.txt'));
    const soyadListesii = await dosyaYolunuAll(yoll.join(__dirname, 'soyad.txt'));

    const uzmanlikkAlanlarii = [
      'Dahiliye', 'Cerrahi', 'Kadın Hastalıkları ve Doğum', 'Psikiyatri', 'Göz Hastalıkları',
      'Ortopedi', 'Kardiyoloji', 'Nöroloji', 'Üroloji', 'Kulak Burun Boğaz',
      'Plastik Cerrahi', 'Radyoloji', 'Onkoloji', 'Dermatoloji', 'Pediatri',
    ];

    const hastanelerr = [
      "Kocaeli Şehir Hastanesi", "Kocaeli Devlet Hastanesi", "Kocaeli Üniversitesi Hastanesi",
      "Derince Eğitim ve Araştırma Hastanesi", "Gölcük Devlet Hastanesi", "Kandıra Devlet Hastanesi",
      "Gebze Fatih Devlet Hastanesi", "Başiskele Devlet Hastanesi", "Çayırova Devlet Hastanesi",
      "Darıca Farabi Hastanesi", "İzmit Özel Can Hastanesi", "Acıbadem Hastanesi",
      "Memorial Hastanesi", "Medipol Hastanesi", "American Hospital", "Liv Hospital",
      "Şişli Hamidiye Etfal Hastanesi", "Koç Üniversitesi Hastanesi", "Cerrahpaşa Tıp Fakültesi Hastanesi",
      "Beşiktaş Tıp Merkezi",
    ];

    for (let i = 0; i < belirtilennSayii; i++) {
      const doktorid = await idKontroluu();
      const ad = await randommVeriiAll(adListesii);
      const soyad = await randommVeriiAll(soyadListesii);
      const uzmanlikalani = await randommVeriiAll(uzmanlikkAlanlarii);
      const calistigiHastane = await randommVeriiAll(hastanelerr);

      const randommDoktorr = {
        doktorid,
        ad,
        soyad,
        uzmanlikalani,
        calistigiHastane,
      };

      await veriiTabaniinaaKaydeett(randommDoktorr);
    }
  } catch (err) {
    console.error('Doktor oluşturulurken hata oluştu:', err);
  } finally {
    await clientİstemcii.end();
  }
}

randommDoktorrOlusturr(10);
