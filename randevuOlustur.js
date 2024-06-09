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
  const date = new Date(baslangicc.getTime() + Math.random() * (bitiiss.getTime() - baslangicc.getTime()));
  return date.toISOString().split('T')[0];
}

function randommSaatt(suSaatten, buSaate) {
  const saatt = Math.floor(Math.random() * (buSaate - suSaatten) + suSaatten);
  const dakikaa = Math.floor(Math.random() * 60);
  const saniyee = Math.floor(Math.random() * 60);
  return `${String(saatt).padStart(2, '0')}:${String(dakikaa).padStart(2, '0')}:${String(saniyee).padStart(2, '0')}`;
}

async function idKontroluu() {
  let randevuid;
  let essizMi = false;

  while (!essizMi) {
        // 10000 ile 99999 arasında rastgele bir randevuid oluştur
    randevuid = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
        // Veritabanında bu randevuid'nin var olup olmadığını kontrol et
    const sonuucc = await clientİstemcii.query('SELECT COUNT(*) FROM randevular WHERE randevuid = $1', [randevuid]);
        // Eğer bu randevuid yoksa essizMi = true yap ve döngüden çık
    if (sonuucc.rows[0].count == 0) {
      essizMi = true;
    }
  }

  return randevuid;
}

async function randommRandevuuOlusturr(count) {
  await clientİstemcii.connect();

  try {
    for (let i = 0; i < count; i++) {
      const hastaid = await randommVeriiAll('hastalar', 'hastaid');
      const doktorid = await randommVeriiAll('doktorlar', 'doktorid');

      const randevutarihi = randommTariih(new Date('2024-01-01'), new Date('2025-01-01'));
      const randevusaati = randommSaatt(8, 17);
      const randevuid = await idKontroluu();

      const sqlSorguusuu = `
        INSERT INTO randevular (randevuid, randevutarihi, randevusaati, hastaid, doktorid)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING randevuid
      `;

      const sonuucc = await clientİstemcii.query(sqlSorguusuu, [randevuid, randevutarihi, randevusaati, hastaid, doktorid]);

      console.log(`Randevu başarıyla oluşturuldu. Randevu ID: ${sonuucc.rows[0].randevuid}`);
    }
  } catch (err) {
    console.error('Randevu oluşturulurken hata oluştu:', err);
  } finally {
    await clientİstemcii.end();
  }
}

randommRandevuuOlusturr(25);
