function calculate() {
  // Cinsiyet seçeneğini al
  var cinsiyet = document.querySelector('input[name="radio"]:checked');
  
  // Cinsiyet seçili değilse uyarı ver
  if (!cinsiyet) {
    alert("Lütfen cinsiyet seçin");
    return;
  }
  
  cinsiyet = cinsiyet.value;

  // Boy ve kilo değerlerini al
  var boy = parseFloat(document.getElementById('height').value);
  var kilo = parseFloat(document.getElementById('weight').value);

  // Boy ve kilo değerleri geçerli değilse uyarı ver
  if (isNaN(boy) || isNaN(kilo) || boy <= 0 || kilo <= 0) {
    alert("Lütfen geçerli bir boy ve kilo girin");
    return;
  }

    // BMI hesapla
    var bki = kilo / ((boy / 100) * (boy / 100));

    // Hesaplama sonuçlarına göre uygun mesajı belirle
    var sonucText = "";
    if (cinsiyet === "m") {
      if (bki < 20) {
        sonucText = "Zayıf";
      } else if (bki >= 20 && bki < 25) {
        sonucText = "Normal";
      } else if (bki >= 25 && bki < 30) {
        sonucText = "Kilolu";
      } else {
        sonucText = "Obez";
      }
    } else {
      if (bki < 19) {
        sonucText = "Zayıf";
      } else if (bki >= 19 && bki < 24) {
        sonucText = "Normal";
      } else if (bki >= 24 && bki < 29) {
        sonucText = "Kilolu";
      } else {
        sonucText = "Obez";
      }
    }
  

  // Sonuçları ekrana yazdır
  document.getElementById('result').innerText = "BKİ: " + bki.toFixed(2);
  document.querySelector('.comment').innerText = "Durum: " + sonucText;
}


/* Draggle JS Coding Start */

// DOM öğelerini seç
const modalGosterBtn = document.querySelector(".show-modal");
const altSayfa = document.querySelector(".bottom-sheet");
const sayfaOrtasi = altSayfa.querySelector(".sheet-overlay");
const icerikSayfasi = altSayfa.querySelector(".content");
const surukleIcon = altSayfa.querySelector(".drag-icon");

// Sürükleme olaylarını takip etmek için global değişkenler
let suruklemeDurumu = false, baslangicY, baslangicYukseklik;

// Alt sayfayı göster, sayfa dikey kaydırma çubuğunu gizle ve icerikSayfasiYukseklikGuncelle fonksiyonunu çağır
const altSayfayiGoster = () => {
  altSayfa.classList.add("show");
  document.body.style.overflowY = "hidden";
  icerikSayfasiYukseklikGuncelle(50);
}

const icerikSayfasiYukseklikGuncelle = (yukseklik) => {
  icerikSayfasi.style.height = `${yukseklik}vh`; // içerik sayfasının yüksekliğini günceller
  // Yükseklik 100'e eşitse, bottomSheet'e tam ekran sınıfını açar
  altSayfa.classList.toggle("fullscreen", yukseklik === 100);
}

// Alt sayfayı gizle ve sayfa dikey kaydırma çubuğunu göster
const altSayfayiGizle = () => {
  altSayfa.classList.remove("show");
  document.body.style.overflowY = "auto";
}

// Başlangıç sürükleme pozisyonunu, icerikSayfasi yüksekliğini ayarlar ve altSayfa'ya sürükleme sınıfını ekler
const suruklemeBaslangic = (e) => {
  suruklemeDurumu = true;
  baslangicY = e.pageY || e.touches?.[0].pageY;
  baslangicYukseklik = parseInt(icerikSayfasi.style.height);
  altSayfa.classList.add("dragging");
}

// İcerikSayfasi için yeni yüksekliği hesaplar ve icerikSayfasiYukseklikGuncelle fonksiyonunu çağırır
const surukleme = (e) => {
  if (!suruklemeDurumu) return;
  const delta = baslangicY - (e.pageY || e.touches?.[0].pageY);
  const yeniYukseklik = baslangicYukseklik + delta / window.innerHeight * 100;
  icerikSayfasiYukseklikGuncelle(yeniYukseklik);
}

// Alt sayfayı gizlemek, tam ekrana ayarlamak veya varsayılan yüksekliğe ayarlamak 
// için icerikSayfasiYukseklikGuncelle fonksiyonuna bağlı olarak mevcut yüksekliği belirler
const suruklemeDuraklat = () => {
  suruklemeDurumu = false;
  altSayfa.classList.remove("dragging");
  const sayfaYukseklik = parseInt(icerikSayfasi.style.height);
  sayfaYukseklik < 25 ? altSayfayiGizle() : sayfaYukseklik > 75 ? icerikSayfasiYukseklikGuncelle(100) : icerikSayfasiYukseklikGuncelle(50);
}

surukleIcon.addEventListener("mousedown", suruklemeBaslangic);
document.addEventListener("mousemove", surukleme);
document.addEventListener("mouseup", suruklemeDuraklat);

surukleIcon.addEventListener("touchstart", suruklemeBaslangic);
document.addEventListener("touchmove", surukleme);
document.addEventListener("touchend", suruklemeDuraklat);

sayfaOrtasi.addEventListener("click", altSayfayiGizle);
modalGosterBtn.addEventListener("click", altSayfayiGoster);

/* Draggle JS Coding End */
