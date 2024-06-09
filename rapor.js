//Express.js kullanılarak sunucu tarafında HTTP POST ve GET isteklerine yanıt verilmektedir. 
//İstemci (tarayıcı) tarafından yapılan istekler, sunucu tarafında işlenir ve uygun yanıtlar oluşturularak istemciye gönderilir.

const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const yoll = require('path');


const aapppExppress = express();
const porttNumarasii = 3005;

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
  const htmlDosyaaYoluu = yoll.join(__dirname, 'rapor.html');
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



// Rapor ekleme endpoint'i
aapppExppress.post('/raporekle', async (req, res) => {
  const { raporid, raportarihi, raporicerigi, hastaid } = req.body;

  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    await clientİstemcii.query('BEGIN'); // İşlemi başlat
    const sqlSorguusuu = 'INSERT INTO tibbiraporlar (raporid, raportarihi, raporicerigi, hastaid) VALUES ($1, $2, $3, $4)';
    const degerrlerr = [raporid, raportarihi, raporicerigi, hastaid];
    await clientİstemcii.query(sqlSorguusuu, degerrlerr); // SQL sorgusunu çalıştır
    await clientİstemcii.query('COMMIT'); // İşlemi onayla
    res.send('Rapor başarıyla eklendi.');
  } catch (err) {
    await clientİstemcii.query('ROLLBACK'); // Hata durumunda işlemi geri al
    console.error('Rapor eklenirken hata oluştu:', err); // Hata mesajını konsola yazdır
    res.status(500).send('Rapor eklenirken bir hata oluştu.'); // Hata yanıtını istemciye gönder
  } finally {
    clientİstemcii.release(); // Veritabanı istemcisini serbest bırak
  }
});


// '/tibbiraporlar' endpoint'ine gelen GET isteklerini işleyen fonksiyon
// Veritabanındaki tüm doktorları alarak bir HTML tablosu olarak yanıt döner
aapppExppress.get('/tibbiraporlar', async (req, res) => {
  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // Tüm raporları veritabanından al
    const sonuucc = await clientİstemcii.query('SELECT * FROM tibbiraporlar');
    const tibbiraporlar = sonuucc.rows;

    // Eğer en az bir rapor bulunursa
    if (tibbiraporlar.length > 0) {
      // raporları bir HTML tablosu olarak yanıt olarak gönder
      res.send(`
        <table>
          <tr>
            <th>Rapor ID</th>
            <th>Rapor Tarihi</th>
            <th>Rapor İçeriği</th>
            <th>Hasta ID</th>
          </tr>
          ${tibbiraporlar.map(rapor => `
            <tr>
              <td>${rapor.raporid}</td>
              <td>${rapor.raportarihi}</td>
              <td>${rapor.raporicerigi}</td>
              <td>${rapor.hastaid}</td>
            </tr>
          `).join('')}
        </table>
      `);
    } else {
      // Hiç rapor bulunamazsa, uygun bir mesaj gönder
      res.send("Veritabanında hiç rapor bulunamadı.");
    }
  } catch (err) {
    // Hata durumunda, hatayı konsola yazdır ve uygun bir hata mesajı gönder
    console.error('Raporlar listelenirken hata oluştu:', err);
    res.status(500).send('Raporlar listelenirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});


// '/raporsil/:raporid' endpoint'ine gelen DELETE isteklerini işleyen fonksiyon
// Belirtilen rapor ID'sine sahip doktoru veritabanından siler
aapppExppress.delete('/raporsil/:raporid', async (req, res) => {
  // İstekten rapor ID'sini al
  const raporId = req.params.raporid;

  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // İşlemi başlat
    await clientİstemcii.query('BEGIN');
    // Doktoru silmek için SQL sorgusunu hazırla
    const sqlSorguusuu = 'DELETE FROM tibbiraporlar WHERE raporid = $1';
    const degerrlerr = [raporId];
    // SQL sorgusunu çalıştır
    const sonuucc = await clientİstemcii.query(sqlSorguusuu, degerrlerr);
    
    // Eğer silme işlemi gerçekleştiyse etkilenen satır sayısı 1 olacaktır.
    if (sonuucc.rowCount === 1) {
      // İşlemi onayla
      await clientİstemcii.query('COMMIT');
      // Başarılı yanıtı gönder
      res.send('Rapor başarıyla silindi.');
    } else {
      // Eğer belirtilen rapor bulunamadıysa 404 hatası gönder
      res.status(404).send('Belirtilen rapor bulunamadı.');
    }
  } catch (err) {
    // Hata durumunda işlemi geri al
    await clientİstemcii.query('ROLLBACK');
    // Hata mesajını konsola yazdır
    console.error('Rapor silinirken hata oluştu:', err);
    // Uygun bir hata yanıtı gönder
    res.status(500).send('Rapor silinirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});



// '/update' endpoint'ine gelen POST isteklerini işleyen fonksiyon
// Belirtilen rapor ID'sine sahip doktorun bilgilerini günceller
aapppExppress.post('/update', async (req, res) => {
  // İstekten güncellenen rapor bilgilerini al
  const { raporid, raportarihi, raporicerigi, hastaid } = req.body;

  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // Belirtilen ID'ye sahip raporun varlığını kontrol et
    const sorguuKontroll = 'SELECT * FROM tibbiraporlar WHERE raporid = $1';
    const degerrKontroll = [raporid];
    const sonuccKontroll = await clientİstemcii.query(sorguuKontroll, degerrKontroll);
    if (sonuccKontroll.rows.length === 0) {
      // Belirtilen ID'ye sahip rapor bulunamazsa, uygun bir mesaj döndür
      return res.status(404).send('Belirtilen ID\'ye sahip rapor bulunamadı.');
    }

    // Belirtilen ID'ye sahip rapor varsa güncelleme işlemine devam et
    await clientİstemcii.query('BEGIN'); // İşlemi başlat
    const sqlSorguusuu = 'UPDATE tibbiraporlar SET raportarihi = $1, raporicerigi = $2, hastaid = $3 WHERE raporid = $4';
    const degerrlerr = [ raportarihi, raporicerigi, hastaid, raporid];
    await clientİstemcii.query(sqlSorguusuu, degerrlerr); // Güncelleme sorgusunu çalıştır
    await clientİstemcii.query('COMMIT'); // İşlemi onayla
    res.send('Rapor başarıyla güncellendi.');
  } catch (err) {
    // Hata durumunda işlemi geri al
    await clientİstemcii.query('ROLLBACK');
    // Hata mesajını konsola yazdır
    console.error('Rapor güncellenirken hata oluştu:', err);
    // Uygun bir hata yanıtı gönder
    res.status(500).send('Rapor güncellenirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});


// Sunucuyu başlat
aapppExppress.listen(porttNumarasii, () => {
  console.log(`Sunucu ${porttNumarasii} portunda başlatıldı.`);
});
