//Express.js kullanılarak sunucu tarafında HTTP POST ve GET isteklerine yanıt verilmektedir. 
//İstemci (tarayıcı) tarafından yapılan istekler, sunucu tarafında işlenir ve uygun yanıtlar oluşturularak istemciye gönderilir.

const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const yoll = require('path');


const aapppExppress = express();
const porttNumarasii = 3003;

// PostgreSQL bağlantı bilgileri
const baglantiiHavuzuu = new Pool({
  user: 'postgres',  // Veritabanı kullanıcı adı
  host: 'localhost',  // Veritabanı host adresi
  database: 'prolab',  // Veritabanı adı
  password: '123',  // Veritabanı şifresi
  port: 5432,  // Veritabanı portu
});

// URL kodlanmış verileri işlemek için
aapppExppress.use(express.urlencoded({ extended: true }));
aapppExppress.use(express.static(__dirname)); // Ana dizindeki tüm dosyaları sunucuya açar

// Ana sayfa
aapppExppress.get('/', (req, res) => {
  // HTML dosyasının yolu
  const htmlDosyaaYoluu = yoll.join(__dirname, 'hasta.html');
  // HTML dosyasını oku ve gönder
  fs.readFile(htmlDosyaaYoluu, 'utf8', (err, data) => {
    if (err) {
      console.error('Dosya okunurken bir hata oluştu:', err);
      res.status(500).send('Sunucuda bir hata oluştu.');
    } else {
      res.send(data);
    }
  });
});



// Hasta ekleme endpoint'i
aapppExppress.post('/hastaekle', async (req, res) => {
  const { hastaid, ad, soyad, dogumtarihi, cinsiyet, telefonnumarasi, adres } = req.body;

  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    await clientİstemcii.query('BEGIN'); // İşlemi başlat
    const sqlSorguusuu = 'INSERT INTO hastalar (hastaid, ad, soyad, dogumtarihi, cinsiyet, telefonnumarasi, adres) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    const degerrlerr = [hastaid, ad, soyad, dogumtarihi, cinsiyet, telefonnumarasi, adres];
    await clientİstemcii.query(sqlSorguusuu, degerrlerr); // SQL sorgusunu çalıştır
    await clientİstemcii.query('COMMIT'); // İşlemi onayla
    res.send('Hasta başarıyla eklendi.');
  } catch (err) {
    await clientİstemcii.query('ROLLBACK'); // Hata durumunda işlemi geri al
    console.error('Hasta eklenirken hata oluştu:', err); // Hata mesajını konsola yazdır
    res.status(500).send('Hasta eklenirken bir hata oluştu.'); // Hata yanıtını istemciye gönder
  } finally {
    clientİstemcii.release(); // Veritabanı istemcisini serbest bırak
  }
});


// '/hastalarlar' endpoint'ine gelen GET isteklerini işleyen fonksiyon
// Veritabanındaki tüm doktorları alarak bir HTML tablosu olarak yanıt döner
aapppExppress.get('/hastalar', async (req, res) => {
  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // Tüm doktorları veritabanından al
    const sonuucc = await clientİstemcii.query('SELECT * FROM hastalar');
    const hastalar = sonuucc.rows;

    // Eğer en az bir hasta bulunursa
    if (hastalar.length > 0) {
      // Doktorları bir HTML tablosu olarak yanıt olarak gönder
      res.send(`
        <table>
          <tr>
            <th>ID</th>
            <th>Ad</th>
            <th>Soyad</th>
            <th>Dogum Tarihi</th>
            <th>Cinsiyet</th>
            <th>Telefon Numarası</th>
            <th>Adres</th>
          </tr>
          ${hastalar.map(hasta => `
            <tr>
              <td>${hasta.hastaid}</td>
              <td>${hasta.ad}</td>
              <td>${hasta.soyad}</td>
              <td>${hasta.dogumtarihi}</td>
              <td>${hasta.cinsiyet}</td>
              <td>${hasta.telefonnumarasi}</td>
              <td>${hasta.adres}</td>
            </tr>
          `).join('')}
        </table>
      `);
    } else {
      // Hiç hasta bulunamazsa, uygun bir mesaj gönder
      res.send("Veritabanında hiç hasta bulunamadı.");
    }
  } catch (err) {
    // Hata durumunda, hatayı konsola yazdır ve uygun bir hata mesajı gönder
    console.error('Hastalar listelenirken hata oluştu:', err);
    res.status(500).send('Hastalar listelenirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});


// '/hastasil/:hastaid' endpoint'ine gelen DELETE isteklerini işleyen fonksiyon
// Belirtilen hasta ID'sine sahip doktoru veritabanından siler
aapppExppress.delete('/hastasil/:hastaid', async (req, res) => {
  // İstekten hasta ID'sini al
  const hastaId = req.params.hastaid;

  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // İşlemi başlat
    await clientİstemcii.query('BEGIN');
    // Doktoru silmek için SQL sorgusunu hazırla
    const sqlSorguusuu = 'DELETE FROM hastalar WHERE hastaid = $1';
    const degerrlerr = [hastaId];
    // SQL sorgusunu çalıştır
    const sonuucc = await clientİstemcii.query(sqlSorguusuu, degerrlerr);
    
    // Eğer silme işlemi gerçekleştiyse etkilenen satır sayısı 1 olacaktır.
    if (sonuucc.rowCount === 1) {
      // İşlemi onayla
      await clientİstemcii.query('COMMIT');
      // Başarılı yanıtı gönder
      res.send('Hasta başarıyla silindi.');
    } else {
      // Eğer belirtilen hasta bulunamadıysa 404 hatası gönder
      res.status(404).send('Belirtilen hasta bulunamadı.');
    }
  } catch (err) {
    // Hata durumunda işlemi geri al
    await clientİstemcii.query('ROLLBACK');
    // Hata mesajını konsola yazdır
    console.error('Hasta silinirken hata oluştu:', err);
    // Uygun bir hata yanıtı gönder
    res.status(500).send('Hasta silinirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});



// '/update' endpoint'ine gelen POST isteklerini işleyen fonksiyon
// Belirtilen hasta ID'sine sahip doktorun bilgilerini günceller
aapppExppress.post('/update', async (req, res) => {
  // İstekten güncellenen hasta bilgilerini al
  const { hastaid, ad, soyad, dogumtarihi, cinsiyet, telefonnumarasi, adres } = req.body;

  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // Belirtilen ID'ye sahip doktorun varlığını kontrol et
    const sorguuKontroll = 'SELECT * FROM hastalar WHERE hastaid = $1';
    const degerrKontroll = [hastaid];
    const sonuccKontroll = await clientİstemcii.query(sorguuKontroll, degerrKontroll);
    if (sonuccKontroll.rows.length === 0) {
      // Belirtilen ID'ye sahip hasta bulunamazsa, uygun bir mesaj döndür
      return res.status(404).send('Belirtilen ID\'ye sahip hasta bulunamadı.');
    }

    // Belirtilen ID'ye sahip hasta varsa güncelleme işlemine devam et
    await clientİstemcii.query('BEGIN'); // İşlemi başlat
    const sqlSorguusuu = 'UPDATE hastalar SET ad = $1, soyad = $2, dogumtarihi = $3, cinsiyet = $4, telefonnumarasi = $5, adres = $6 WHERE hastaid = $7';
    const degerrlerr = [ad, soyad, dogumtarihi, cinsiyet, telefonnumarasi, adres, hastaid];
    await clientİstemcii.query(sqlSorguusuu, degerrlerr); // Güncelleme sorgusunu çalıştır
    await clientİstemcii.query('COMMIT'); // İşlemi onayla
    res.send('Hasta başarıyla güncellendi.');
  } catch (err) {
    // Hata durumunda işlemi geri al
    await clientİstemcii.query('ROLLBACK');
    // Hata mesajını konsola yazdır
    console.error('Hasta güncellenirken hata oluştu:', err);
    // Uygun bir hata yanıtı gönder
    res.status(500).send('Hasta güncellenirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});


// Sunucuyu başlat
aapppExppress.listen(porttNumarasii, () => {
  console.log(`Sunucu ${porttNumarasii} portunda başlatıldı.`);
});
