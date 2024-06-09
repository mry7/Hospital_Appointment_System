const { Client } = require('pg');

// PostgreSQL bağlantı bilgileri
const clientİstemcii = new Client({
  user: 'postgres',  // Veritabanı kullanıcı adı
  host: 'localhost',  // Veritabanı host adresi
  database: 'prolab',  // Veritabanı adı
  password: '123',  // Veritabanı şifresi
  port: 5432,  // Veritabanı portu
});

async function randommVeriiAll(tablooAdii, sutunn) {
  const sonuucc = await clientİstemcii.query(`SELECT ${sutunn} FROM ${tablooAdii} ORDER BY RANDOM() LIMIT 1`);
  return sonuucc.rows[0][sutunn];
}

function randommTariih(baslangicc, bitiiss) {
  const tariih = new Date(baslangicc.getTime() + Math.random() * (bitiiss.getTime() - baslangicc.getTime()));
  return tariih.toISOString().split('T')[0];
}

async function idKontroluu() {
  let raporid;
  let essizMi = false;

  while (!essizMi) {
    raporid = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    const sonuucc = await clientİstemcii.query('SELECT COUNT(*) FROM tibbiraporlar WHERE raporid = $1', [raporid]);
    if (sonuucc.rows[0].count == 0) {
      essizMi = true;
    }
  }

  return raporid;
}

async function randommRaporrOlusturr(count) {
  await clientİstemcii.connect();

  try {
    for (let i = 0; i < count; i++) {
      const hastaid = await randommVeriiAll('hastalar', 'hastaid');

      const raportarihi = randommTariih(new Date('2024-01-01'), new Date('2025-01-01'));
      const raporicerigi = `https://drive.google.com/file/d/1lUDpXbi6xVwv-8wkQRo0Vnbx-ZZ0_bqs/view?usp=sharing`;
      const raporid = await idKontroluu();

      const sqlSorguusuu = `
        INSERT INTO tibbiraporlar (raporid, raportarihi, raporicerigi, hastaid)
        VALUES ($1, $2, $3, $4)
        RETURNING raporid
      `;

      const sonuucc = await clientİstemcii.query(sqlSorguusuu, [raporid, raportarihi, raporicerigi, hastaid]);

      console.log(`Tıbbi rapor başarıyla oluşturuldu. Rapor ID: ${sonuucc.rows[0].raporid}`);
    }
  } catch (err) {
    console.error('Tıbbi rapor oluşturulurken hata oluştu:', err);
  } finally {
    await clientİstemcii.end();
  }
}

randommRaporrOlusturr(25);
