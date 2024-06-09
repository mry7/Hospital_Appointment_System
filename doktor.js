//Express.js kullanılarak sunucu tarafında HTTP POST ve GET isteklerine yanıt verilmektedir. 
//İstemci (tarayıcı) tarafından yapılan istekler, sunucu tarafında işlenir ve uygun yanıtlar oluşturularak istemciye gönderilir.

const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const yoll = require('path');


const aapppExppress = express();
const porttNumarasii = 3002;

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
  const htmlDosyaaYoluu = yoll.join(__dirname, 'doktor.html');
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



// Doktor ekleme endpoint'i
aapppExppress.post('/doktorekle', async (req, res) => {
  const { doktorid, ad, soyad, uzmanlikalani, calistigihastane } = req.body;

  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    await clientİstemcii.query('BEGIN'); // İşlemi başlat
    const sqlSorguusuu = 'INSERT INTO doktorlar (doktorid, ad, soyad, uzmanlikalani, calistigihastane) VALUES ($1, $2, $3, $4, $5)';
    const degerrlerr = [doktorid, ad, soyad, uzmanlikalani, calistigihastane];
    await clientİstemcii.query(sqlSorguusuu, degerrlerr); // SQL sorgusunu çalıştır
    await clientİstemcii.query('COMMIT'); // İşlemi onayla
    res.send('Doktor başarıyla eklendi.');
  } catch (err) {
    await clientİstemcii.query('ROLLBACK'); // Hata durumunda işlemi geri al
    console.error('Doktor eklenirken hata oluştu:', err); // Hata mesajını konsola yazdır
    res.status(500).send('Doktor eklenirken bir hata oluştu.'); // Hata yanıtını istemciye gönder
  } finally {
    clientİstemcii.release(); // Veritabanı istemcisini serbest bırak
  }
});


// '/doktorlar' endpoint'ine gelen GET isteklerini işleyen fonksiyon
// Veritabanındaki tüm doktorları alarak bir HTML tablosu olarak yanıt döner
aapppExppress.get('/doktorlar', async (req, res) => {
  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // Tüm doktorları veritabanından al
    const sonuucc = await clientİstemcii.query('SELECT * FROM doktorlar');
    const doktorlar = sonuucc.rows;

    // Eğer en az bir doktor bulunursa
    if (doktorlar.length > 0) {
      // Doktorları bir HTML tablosu olarak yanıt olarak gönder
      res.send(`
        <table>
          <tr>
            <th>ID</th>
            <th>Ad</th>
            <th>Soyad</th>
            <th>Uzmanlık Alanı</th>
            <th>Çalıştığı Hastane</th>
          </tr>
          ${doktorlar.map(doktor => `
            <tr>
              <td>${doktor.doktorid}</td>
              <td>${doktor.ad}</td>
              <td>${doktor.soyad}</td>
              <td>${doktor.uzmanlikalani}</td>
              <td>${doktor.calistigihastane}</td>
            </tr>
          `).join('')}
        </table>
      `);
    } else {
      // Hiç doktor bulunamazsa, uygun bir mesaj gönder
      res.send("Veritabanında hiç doktor bulunamadı.");
    }
  } catch (err) {
    // Hata durumunda, hatayı konsola yazdır ve uygun bir hata mesajı gönder
    console.error('Doktorlar listelenirken hata oluştu:', err);
    res.status(500).send('Doktorlar listelenirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});



// '/doktorsil/:doktorid' endpoint'ine gelen DELETE isteklerini işleyen fonksiyon
// Belirtilen doktor ID'sine sahip doktoru veritabanından siler
aapppExppress.delete('/doktorsil/:doktorid', async (req, res) => {
  // İstekten doktor ID'sini al
  const doktorId = req.params.doktorid;

  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // İşlemi başlat
    await clientİstemcii.query('BEGIN');
    
    // Doktorun aktif randevusu olup olmadığını kontrol et
    const kontrolSorgusuu = 'SELECT COUNT(*) FROM randevular WHERE doktorid = $1';
    const kontrolSonucuu = await clientİstemcii.query(kontrolSorgusuu, [doktorId]);
    
    if (parseInt(kontrolSonucuu.rows[0].count) > 0) {
      // Eğer doktorun aktif randevusu varsa işlemi geri al
      await clientİstemcii.query('ROLLBACK');
      res.status(400).send('Bu doktorun aktif randevusu olduğundan silinemez.');
    } else {
      // Doktoru silmek için SQL sorgusunu hazırla
      const sqlSorguusuu = 'DELETE FROM doktorlar WHERE doktorid = $1';
      const degerrlerr = [doktorId];
      // SQL sorgusunu çalıştır
      const sonuucc = await client.query(sqlSorguusuu, degerrlerr);
      
      // Eğer silme işlemi gerçekleştiyse etkilenen satır sayısı 1 olacaktır.
      if (sonuucc.rowCount === 1) {
        // İşlemi onayla
        await clientİstemcii.query('COMMIT');
        // Başarılı yanıtı gönder
        res.send('Doktor başarıyla silindi.');
      } else {
        // Eğer belirtilen doktor bulunamadıysa 404 hatası gönder
        await clientİstemcii.query('ROLLBACK');
        res.status(404).send('Belirtilen doktor bulunamadı.');
      }
    }
  } catch (err) {
    // Hata durumunda işlemi geri al
    await clientİstemcii.query('ROLLBACK');
    // Hata mesajını konsola yazdır
    console.error('Doktor silinirken hata oluştu:', err);
    // Uygun bir hata yanıtı gönder
    res.status(500).send('Doktor silinirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});



// '/update' endpoint'ine gelen POST isteklerini işleyen fonksiyon
// Belirtilen doktor ID'sine sahip doktorun bilgilerini günceller
aapppExppress.post('/update', async (req, res) => {
  // İstekten güncellenen doktor bilgilerini al
  const { doktorid, ad, soyad, uzmanlikalani, calistigihastane } = req.body;

  // Veritabanına bağlanmak için bir istemci oluştur
  const clientİstemcii = await baglantiiHavuzuu.connect();
  try {
    // Belirtilen ID'ye sahip doktorun varlığını kontrol et
    const sorguuKontroll = 'SELECT * FROM doktorlar WHERE doktorid = $1';
    const degerrKontroll = [doktorid];
    const sonuccKontroll = await clientİstemcii.query(sorguuKontroll, degerrKontroll);
    if (sonuccKontroll.rows.length === 0) {
      // Belirtilen ID'ye sahip doktor bulunamazsa, uygun bir mesaj döndür
      return res.status(404).send('Belirtilen ID\'ye sahip doktor bulunamadı.');
    }

    // Belirtilen ID'ye sahip doktor varsa güncelleme işlemine devam et
    await clientİstemcii.query('BEGIN'); // İşlemi başlat
    const sqlSorguusuu = 'UPDATE doktorlar SET ad = $1, soyad = $2, uzmanlikalani = $3, calistigihastane = $4 WHERE doktorid = $5';
    const degerrlerr = [ad, soyad, uzmanlikalani, calistigihastane, doktorid];
    await clientİstemcii.query(sqlSorguusuu, degerrlerr); // Güncelleme sorgusunu çalıştır
    await clientİstemcii.query('COMMIT'); // İşlemi onayla
    res.send('Doktor başarıyla güncellendi.');
  } catch (err) {
    // Hata durumunda işlemi geri al
    await clientİstemcii.query('ROLLBACK');
    // Hata mesajını konsola yazdır
    console.error('Doktor güncellenirken hata oluştu:', err);
    // Uygun bir hata yanıtı gönder
    res.status(500).send('Doktor güncellenirken bir hata oluştu.');
  } finally {
    // Veritabanı istemcisini serbest bırak
    clientİstemcii.release();
  }
});


// Sunucuyu başlat
aapppExppress.listen(porttNumarasii, () => {
  console.log(`Sunucu ${porttNumarasii} portunda başlatıldı.`);
});
