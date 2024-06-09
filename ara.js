//Express.js kullanılarak sunucu tarafında HTTP POST ve GET isteklerine yanıt verilmektedir. 
//İstemci (tarayıcı) tarafından yapılan istekler, sunucu tarafında işlenir ve uygun yanıtlar oluşturularak istemciye gönderilir.

const express = require('express');
const { Pool } = require('pg');
const fs = require('fs');
const yoll = require('path');

const aapppExppress = express();
const porttNumarasii = 3007;

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
  const htmlDosyaYolu = yoll.join(__dirname, 'ara.html');
  // HTML dosyasını oku ve gönder
  fs.readFile(htmlDosyaYolu, 'utf8', (err, data) => {
    if (err) {
      console.error('Dosya okunurken bir hata oluştu:', err);
      res.status(500).send('Sunucuda bir hata oluştu.');
    } else {
      res.send(data);
    }
  });
});

// Belirli bir hasta ID'sine sahip hastanın bilgilerini getirme endpoint'i
aapppExppress.get('/hastabilgilerii', (req, res) => {
    const hastaId = req.query.hastaId;
  
    // PostgreSQL sorgusu ile randevular tablosundan hastanın bilgilerini çekme
    baglantiiHavuzuu.query('SELECT * FROM randevular WHERE hastaid = $1', [hastaId], (err, result) => {
      if (err) {
        console.error('Sorgu sırasında bir hata oluştu:', err);
        res.status(500).send('Sunucuda bir hata oluştu.');
      } else {
        if (result.rows.length === 0) {
          res.status(404).send('Belirtilen hasta ID\'si ile eşleşen bir randevu bulunamadı.');
        } else {
          const randevuu = result.rows[0];
          const hastaId = randevuu.hastaid;
  
          // Randevunun hastasının bilgilerini çekme
          baglantiiHavuzuu.query('SELECT * FROM hastalar WHERE hastaid = $1', [hastaId], (err, result) => {
            if (err) {
              console.error('Sorgu sırasında bir hata oluştu:', err);
              res.status(500).send('Sunucuda bir hata oluştu.');
            } else {
              if (result.rows.length === 0) {
                res.status(404).send('Belirtilen hasta ID\'si ile eşleşen bir hasta bulunamadı.');
              } else {
                const hasta = result.rows[0];
                res.json(hasta); // Hasta bilgilerini JSON formatında istemciye gönderme
              }
            }
          });
        }
      }
    });
  });
  

  // Belirli bir hasta ID'sine sahip hastanın randevu bilgilerini getirme endpoint'i
aapppExppress.get('/hastarandevulari', (req, res) => {
    const hastaId = req.query.hastaId;
  
    // PostgreSQL sorgusu ile belirtilen hasta ID'sine sahip randevuları çekme
    baglantiiHavuzuu.query('SELECT * FROM randevular WHERE hastaid = $1', [hastaId], (err, result) => {
      if (err) {
        console.error('Sorgu sırasında bir hata oluştu:', err);
        res.status(500).send('Sunucuda bir hata oluştu.');
      } else {
        if (result.rows.length === 0) {
          res.status(404).send('Belirtilen hasta ID\'si ile eşleşen bir randevu bulunamadı.');
        } else {
          const randevular = result.rows;
          res.json(randevular); // Randevu bilgilerini JSON formatında istemciye gönderme
        }
      }
    });
  });
  

  // Belirli bir doktor ID'sine sahip doktorun randevu bilgilerini getirme endpoint'i
aapppExppress.get('/doktorrandevulari', (req, res) => {
    const doktorId = req.query.doktorId;
  
    // PostgreSQL sorgusu ile belirtilen doktor ID'sine sahip randevuları çekme
    baglantiiHavuzuu.query('SELECT * FROM randevular WHERE doktorid = $1', [doktorId], (err, result) => {
      if (err) {
        console.error('Sorgu sırasında bir hata oluştu:', err);
        res.status(500).send('Sunucuda bir hata oluştu.');
      } else {
        if (result.rows.length === 0) {
          res.status(404).send('Belirtilen doktor ID\'si ile eşleşen bir randevu bulunamadı.');
        } else {
          const randevular = result.rows;
          res.json(randevular); // Randevu bilgilerini JSON formatında istemciye gönderme
        }
      }
    });
  });


  // Belirli bir hasta ID'sine sahip hastanın raporlarını getirme endpoint'i
aapppExppress.get('/raporlarigetir', (req, res) => {
    const hastaId = req.query.hastaId;

    // PostgreSQL sorgusu ile belirtilen hasta ID'sine sahip raporları çekme
    baglantiiHavuzuu.query('SELECT * FROM tibbiraporlar WHERE hastaid = $1', [hastaId], (err, result) => {
        if (err) {
            console.error('Sorgu sırasında bir hata oluştu:', err);
            res.status(500).send('Sunucuda bir hata oluştu.');
        } else {
            if (result.rows.length === 0) {
                res.status(404).send('Belirtilen hasta ID\'si ile eşleşen bir rapor bulunamadı.');
            } else {
                const raporlar = result.rows;
                res.json(raporlar); // Rapor bilgilerini JSON formatında istemciye gönderme
            }
        }
    });
});


  // Sunucuyu başlat
aapppExppress.listen(porttNumarasii, () => {
    console.log(`Sunucu ${porttNumarasii} portunda başlatıldı.`);
  });
  