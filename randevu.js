//Express.js kullanılarak sunucu tarafında HTTP POST ve GET isteklerine yanıt verilmektedir. 
//İstemci (tarayıcı) tarafından yapılan istekler, sunucu tarafında işlenir ve uygun yanıtlar oluşturularak istemciye gönderilir.

const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const yoll = require('path');


const aapppExppress = express();
const porttNumarasii = 3004;

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
  const htmlDosyaaYoluu = yoll.join(__dirname, 'randevu.html');
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



// Rendevu alma endpoint'i
aapppExppress.post('/randevual', async (req, res) => {
  const { randevuid, randevutarihi, randevusaati, hastaid, doktorid } = req.body;

  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    await clientİstemcii.query('BEGIN'); // İşlemi başlat
    const sqlSorguusuu = 'INSERT INTO randevular (randevuid, randevutarihi, randevusaati, hastaid, doktorid) VALUES ($1, $2, $3, $4, $5)';
    const degerrlerr = [randevuid, randevutarihi, randevusaati, hastaid, doktorid];
    await clientİstemcii.query(sqlSorguusuu, degerrlerr); // SQL sorgusunu çalıştır
    await clientİstemcii.query('COMMIT'); // İşlemi onayla
    res.send('Randevu başarıyla eklendi.');
  } catch (err) {
    await clientİstemcii.query('ROLLBACK'); // Hata durumunda işlemi geri al
    console.error('Randevu eklenirken hata oluştu:', err); // Hata mesajını konsola yazdır
    res.status(500).send('Randevu eklenirken bir hata oluştu.'); // Hata yanıtını istemciye gönder
  } finally {
    clientİstemcii.release(); // Veritabanı istemcisini serbest bırak
  }
});


// '/randevular' endpoint'ine gelen GET isteklerini işleyen fonksiyon
// Veritabanındaki tüm randevuları alarak bir HTML tablosu olarak yanıt döner
aapppExppress.get('/randevular', async (req, res) => {
  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // Tüm randevuları veritabanından al
    const sonuucc = await clientİstemcii.query('SELECT * FROM randevular');
    const randevular = sonuucc.rows;

    // Eğer en az bir randevu bulunursa
    if (randevular.length > 0) {
      // randevuları bir HTML tablosu olarak yanıt olarak gönder
      res.send(`
        <table>
          <tr>
            <th>Randevu ID</th>
            <th>Randevu Tarihi</th>
            <th>Randevu Saati</th>
            <th>Hasta ID</th>
            <th>Doktor ID</th>
          </tr>
          ${randevular.map(randevu => `
            <tr>
              <td>${randevu.randevuid}</td>
              <td>${randevu.randevutarihi}</td>
              <td>${randevu.randevusaati}</td>
              <td>${randevu.hastaid}</td>
              <td>${randevu.doktorid}</td>
            </tr>
          `).join('')}
        </table>
      `);
    } else {
      // Hiç randevu bulunamazsa, uygun bir mesaj gönder
      res.send("Veritabanında hiç randevu bulunamadı.");
    }
  } catch (err) {
    // Hata durumunda, hatayı konsola yazdır ve uygun bir hata mesajı gönder
    console.error('Randevular listelenirken hata oluştu:', err);
    res.status(500).send('Randevular listelenirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});


// Belirtilen randevu ID'sine sahip doktoru veritabanından siler
aapppExppress.delete('/randevusil/:randevuid', async (req, res) => {
  // İstekten randevu ID'sini al
  const randevuId = req.params.randevuid;

  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // İşlemi başlat
    await clientİstemcii.query('BEGIN');
    // Doktoru silmek için SQL sorgusunu hazırla
    const sqlSorguusuu = 'DELETE FROM randevular WHERE randevuid = $1';
    const degerrlerr = [randevuId];
    // SQL sorgusunu çalıştır
    const sonuucc = await clientİstemcii.query(sqlSorguusuu, degerrlerr);
    
    // Eğer silme işlemi gerçekleştiyse etkilenen satır sayısı 1 olacaktır.
    if (sonuucc.rowCount === 1) {
      // İşlemi onayla
      await clientİstemcii.query('COMMIT');
      // Başarılı yanıtı gönder
      res.send('Randevu başarıyla silindi.');
    } else {
      // Eğer belirtilen randevu bulunamadıysa 404 hatası gönder
      res.status(404).send('Belirtilen randevu bulunamadı.');
    }
  } catch (err) {
    // Hata durumunda işlemi geri al
    await clientİstemcii.query('ROLLBACK');
    // Hata mesajını konsola yazdır
    console.error('Randevu silinirken hata oluştu:', err);
    // Uygun bir hata yanıtı gönder
    res.status(500).send('Randevu silinirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});



// '/update' endpoint'ine gelen POST isteklerini işleyen fonksiyon
// Belirtilen randevu ID'sine sahip doktorun bilgilerini günceller
aapppExppress.post('/update', async (req, res) => {
  // İstekten güncellenen randevu bilgilerini al
  const { randevuid, randevutarihi, randevusaati, hastaid, doktorid } = req.body;

  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // Belirtilen ID'ye sahip doktorun varlığını kontrol et
    const sorguuKontroll = 'SELECT * FROM randevular WHERE randevuid = $1';
    const degerrKontroll = [randevuid];
    const sonuccKontroll = await clientİstemcii.query(sorguuKontroll, degerrKontroll);
    if (sonuccKontroll.rows.length === 0) {
      // Belirtilen ID'ye sahip randevu bulunamazsa, uygun bir mesaj döndür
      return res.status(404).send('Belirtilen ID\'ye sahip randevu bulunamadı.');
    }

    // Belirtilen ID'ye sahip randevu varsa güncelleme işlemine devam et
    await clientİstemcii.query('BEGIN'); // İşlemi başlat
    const sqlSorguusuu = 'UPDATE randevular SET randevutarihi = $1, randevusaati = $2, hastaid = $3, doktorid = $4 WHERE randevuid = $5';
    const degerrlerr = [randevutarihi, randevusaati, hastaid, doktorid, randevuid];
    await clientİstemcii.query(sqlSorguusuu, degerrlerr); // Güncelleme sorgusunu çalıştır
    await clientİstemcii.query('COMMIT'); // İşlemi onayla
    res.send('Randevu başarıyla güncellendi.');
  } catch (err) {
    // Hata durumunda işlemi geri al
    await clientİstemcii.query('ROLLBACK');
    // Hata mesajını konsola yazdır
    console.error('Randevu güncellenirken hata oluştu:', err);
    // Uygun bir hata yanıtı gönder
    res.status(500).send('Randevu güncellenirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});






// Sunucuyu başlat
aapppExppress.listen(porttNumarasii, () => {
  console.log(`Sunucu ${porttNumarasii} portunda başlatıldı.`);
});
