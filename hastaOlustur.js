const { Client } = require('pg');
const fs = require('fs');
const yoll = require('path');

// PostgreSQL bağlantı bilgileri
const clientİstemcii = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'prolab',
  password: '123',
  port: 5432,
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

function randommTariih(baslangicc, bitiiss) {
  const tarihh = new Date(baslangicc.getTime() + Math.random() * (bitiiss.getTime() - baslangicc.getTime()));
  return tarihh.toISOString().split('T')[0];
}

function randommTelefonNumarasii() {
  const telKodu = "05";
  const numaraa = Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  return telKodu + numaraa;
}

async function idKontroluu() {
  let hastaid;
  let essizMi = false;

  while (!essizMi) {
        // 10000 ile 99999 arasında rastgele bir hastaid oluştur
    hastaid = Math.floor(Math.random() * 900000) + 100000;
        // Veritabanında bu hastaid'nin var olup olmadığını kontrol et
    const sonuc = await clientİstemcii.query('SELECT COUNT(*) FROM hastalar WHERE hastaid = $1', [hastaid]);
        // Eğer bu hastaid yoksa essizMi = true yap ve döngüden çık
    if (sonuc.rows[0].count == 0) {
      essizMi = true;
    }
  }

  return hastaid;
}

async function veriiTabaniinaaKaydeett(hasta) {
  const sqlSorguusuu = `
    INSERT INTO hastalar(hastaid, ad, soyad, dogumtarihi, cinsiyet, telefonnumarasi, adres)
    VALUES($1, $2, $3, $4, $5, $6, $7)
  `;
  await clientİstemcii.query(sqlSorguusuu, [
    hasta.hastaid,
    hasta.ad,
    hasta.soyad,
    hasta.dogumtarihi,
    hasta.cinsiyet,
    hasta.telefonnumarasi,
    hasta.adres,
  ]);
  console.log(`Hasta kaydedildi: ${hasta.ad} ${hasta.soyad}`);
}

async function randommHastaaOlusturr(belirtilennSayii) {
  await clientİstemcii.connect();

  try {
    const adListesii = await dosyaYolunuAll(yoll.join(__dirname, 'ad.txt'));
    const soyadListesii = await dosyaYolunuAll(yoll.join(__dirname, 'soyad.txt'));
    const cinsiyett = ['Erkek', 'Kadın'];
    const addresss = [
      'İstanbul, Türkiye',
      'Ankara, Türkiye',
      'İzmir, Türkiye',
      'Bursa, Türkiye',
      'Antalya, Türkiye',
      'Adana, Türkiye',
      'Konya, Türkiye',
      'Gaziantep, Türkiye',
      'Şanlıurfa, Türkiye',
      'Kocaeli, Türkiye',
      'Mersin, Türkiye',
      'Kars, Türkiye',
      'Eskişehir, Türkiye',
      'Balıkesir, Türkiye',
      'Muğla, Türkiye',
      'Adıyaman, Türkiye',
      'Denizli, Türkiye',
      'Hatay, Türkiye',
      'Tekirdağ, Türkiye',
      'Bolu, Türkiye',
    ];

    for (let i = 0; i < belirtilennSayii; i++) {
      const hastaid = await idKontroluu();
      const ad = await randommVeriiAll(adListesii);
      const soyad = await randommVeriiAll(soyadListesii);
      const dogumtarihi = randommTariih(new Date('1940-01-01'), new Date('2024-05-01'));
      const cinsiyet = await randommVeriiAll(cinsiyett);
      const telefonnumarasi = randommTelefonNumarasii();
      const adres = await randommVeriiAll(addresss);

      const randommHastaa = {
        hastaid,
        ad,
        soyad,
        dogumtarihi,
        cinsiyet,
        telefonnumarasi,
        adres,
      };

      await veriiTabaniinaaKaydeett(randommHastaa);
    }
  } catch (err) {
    console.error('Hasta oluşturulurken hata oluştu:', err);
  } finally {
    await clientİstemcii.end();
  }
}

randommHastaaOlusturr(10);
