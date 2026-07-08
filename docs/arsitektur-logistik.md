# Arsitektur Sistem Logistik Garmen — RL Fashion

## 1. Alur Logika Data

```
MASTER BAHAN (Database Pusat)
  ├─ Nama, Kategori, Satuan, WarnaList[]
  └─ Stok=0, HargaBeli=0 (DIKUNCI)

       │
       ▼
SURAT JALAN ORDER (Pesan ke Supplier)
  ├─ Pilih Bahan → Multi-select Warna → Input Roll per Warna
  ├─ Status: Draft → Ordered
  └─ Hanya input JUMLAH ROLL (tanpa berat/panjang)

       │
       ▼ (Setelah barang datang)
PENERIMAAN BARANG (Cek Fisik & Timbangan)
  ├─ Faktur + HargaBeli + Upload Foto Nota
  ├─ Per-roll weight input (otomatis sesuai rollOrdered)
  ├─ Auto: TotalStok = Σ(weight), TotalHarga = TotalStok × HargaBeli
  └─ Status: Received → [Simpan & Masuk Stok] → Stok BERTAMBAH

       │
       ▼ (Saat produksi)
PEMAKAIAN BAHAN (Potong & Produksi)
  ├─ Pilih Bahan + Warna, Input Roll & Berat
  └─ [Simpan Pemakaian] → Stok BERKURANG
```

## 2. Struktur Database (Prisma)

### Model Bahan
```prisma
model Bahan {
  id        String   @id @default(cuid())
  kode      String   @unique          // auto: BH-001
  nama      String
  satuan    String                    // KG / Meter / Pcs
  warnaList String   @default("[]")   // JSON: ["HITAM","PUTIH",...]
  stok      Float    @default(0)      // HANYA dari penerimaan
  hargaBeli Float    @default(0)      // HANYA dari penerimaan
  kategori  String   @default("Kain") // Kain / Aksesoris
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  purchaseOrderItems PurchaseOrderItem[]
  materialUsages     MaterialUsage[]
}
```

### Model PurchaseOrder (Surat Jalan)
```prisma
model PurchaseOrder {
  id          String   @id @default(cuid())
  code        String   @unique          // auto: PO-001
  supplier    String
  status      String   @default("Draft") // Draft → Ordered → Received → Done
  notes       String?
  fakturNo    String?                    // diisi saat penerimaan
  hargaBeli   Float?                     // diisi saat penerimaan
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())

  items PurchaseOrderItem[]
}
```

### Model PurchaseOrderItem (Item Order per Warna)
```prisma
model PurchaseOrderItem {
  id              String        @id @default(cuid())
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  bahanId         String
  bahan           Bahan         @relation(fields: [bahanId], references: [id])
  warna           String                    // warna spesifik
  rollOrdered     Int           @default(0) // jumlah roll dipesan
  weightsJson     String        @default("[]") // JSON: [{"roll":1,"weight":25.5},...]
  totalWeight     Float         @default(0) // Σ weight
  price           Float         @default(0) // totalWeight × hargaBeli
}
```

### Model MaterialUsage (Pemakaian Bahan)
```prisma
model MaterialUsage {
  id          String   @id @default(cuid())
  modelName   String                    // nama model baju
  bahanId     String
  bahan       Bahan    @relation(fields: [bahanId], references: [id])
  warna       String
  rollCount   Int      @default(0)
  totalWeight Float    @default(0)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
}
```

## 3. Relasi Tabel (ERD)

```
  ┌────────────┐       ┌──────────────────┐       ┌──────────────────┐
  │   Bahan    │←──────│ PurchaseOrderItem│──────→│  PurchaseOrder   │
  │────────────│  1:N  │──────────────────│  N:1  │──────────────────│
  │ id         │       │ id               │       │ id               │
  │ nama       │       │ warna            │       │ supplier         │
  │ satuan     │       │ rollOrdered      │       │ status           │
  │ warnaList  │       │ weightsJson      │       │ fakturNo         │
  │ stok       │       │ totalWeight      │       │ hargaBeli        │
  │ hargaBeli  │       │ price            │       └──────────────────┘
  │ kategori   │       └──────────────────┘
  └─────┬──────┘
        │ 1:N
  ┌──────▼──────┐
  │MaterialUsage│
  │─────────────│
  │ modelName   │
  │ warna       │
  │ rollCount   │
  │ totalWeight │
  └─────────────┘
```

## 4. Rancangan UI

### 4a. Master Bahan — Form "Tambah Bahan Baru"
```
┌─────────────────────────────────────────────────────────────┐
│  Tambah Bahan Baru                                          │
├─────────────────────────────────────────────────────────────┤
│  Nama Bahan/Barang: [ Baby Terry                      ]    │
│                                                             │
│  Kategori:         [ ▼ Kain         ]                      │
│  Satuan Utama:     [ ▼ Kilo (Kg)    ]                      │
│                                                             │
│  Variasi Warna (Multi-Select):                              │
│  ┌─────────────────────────────────────────────────┐       │
│  │ [HITAM] [PUTIH] [NAVY] [MAROON] [ABU-ABU]      │       │
│  │ [CREAM] [COKLAT] [HIJAU] [MERAH]  [KUNING]     │       │
│  │ [PINK]  [UNGU]  [BIRU]  [ORANGE] [SILVER]      │       │
│  │ [EMAS]  [MILO]  [ARMY]  [BURGUNDY] [TOSCA]     │       │
│  └─────────────────────────────────────────────────┘       │
│  ➕  Tambah Warna Kustom:                                   │
│  [ Ketik warna baru...       ] → [➕ Tambah Warna]         │
│                                                             │
│  Terpilih: HITAM  ×  NAVY  ×  MAROON  ×  KREM ×           │
│                                                             │
│  [ ❌ Stok & Harga Beli dikunci 0 (isi via Penerimaan) ]   │
│                                                             │
│  [           Simpan Bahan           ]                       │
└─────────────────────────────────────────────────────────────┘
```

### 4b. Surat Jalan Order — Form "Buat Order Baru"
```
┌──────────────────────────────────────────────────────────────────┐
│  Buat Surat Jalan Order Baru                                     │
├──────────────────────────────────────────────────────────────────┤
│  Pilih Supplier/Toko: [ Toko Kain Jaya              ]           │
│                                                                    │
│  Pilih Bahan Baku:    [ ▼ Baby Terry - Kain        ]            │
│                                                                    │
│  ┌─── Pilih Warna ─────────────────────────────────────────┐     │
│  │  ☑ HITAM  ☐ PUTIH  ☑ NAVY  ☐ MAROON  ☐ ABU-ABU       │     │
│  │  ☐ CREAM  ☐ COKLAT ☐ HIJAU  ☐ MERAH   ☐ KUNING       │     │
│  │  ...                                                    │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                    │
│  ┌─── Rincian Order Per Warna ───────────────────────────┐      │
│  │  🔴 HITAM:  [ 5 ] Roll                                │      │
│  │  🔵 NAVY:   [ 3 ] Roll                                │      │
│  └────────────────────────────────────────────────────────┘      │
│                                                                    │
│  [  Simpan sebagai Draft  ]   [  Cetak Surat Jalan  ]            │
└──────────────────────────────────────────────────────────────────┘
```

### 4c. Penerimaan Barang — Dialog "Terima Barang"
```
┌──────────────────────────────────────────────────────────────────┐
│  Terima Barang — PO-001                                          │
├──────────────────────────────────────────────────────────────────┤
│  No. Faktur: [ FG-2026-0710     ]                               │
│  Harga Beli (Per Kg): [ Rp 45.000                    ]          │
│  Upload Nota: [ Pilih File... ]                                  │
│                                                                    │
│  ┌── Warna HITAM (5 Roll) ──────────────────────────┐           │
│  │  Roll 1: [ 25.60 ] Kg    Roll 2: [ 24.80 ] Kg  │           │
│  │  Roll 3: [ 25.00 ] Kg    Roll 4: [ 25.50 ] Kg  │           │
│  │  Roll 5: [ 25.10 ] Kg                           │           │
│  │  Total: 126.00 Kg                               │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                    │
│  ┌── Warna NAVY (3 Roll) ───────────────────────────┐           │
│  │  Roll 1: [ 25.30 ] Kg    Roll 2: [ 24.90 ] Kg  │           │
│  │  Roll 3: [ 25.20 ] Kg                           │           │
│  │  Total: 75.40 Kg                                │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                    │
│  ┌── KALKULASI AKHIR ──────────────────────────────┐            │
│  │  Total Stok Masuk:  201.40 Kg                   │            │
│  │  Total Harga Nota:  Rp 9,063,000               │            │
│  └──────────────────────────────────────────────────┘            │
│                                                                    │
│  [  Simpan & Masuk Stok Master  ]                               │
└──────────────────────────────────────────────────────────────────┘
```

### 4d. Pemakaian Bahan — Form "Catat Pemakaian"
```
┌─────────────────────────────────────────────────────┐
│  Catat Pemakaian Bahan Baru                         │
├─────────────────────────────────────────────────────┤
│  Nama Model/Artikel: [ Celana Kulot            ]   │
│                                                     │
│  Pilih Bahan:  [ ▼ Baby Terry - Stok: 201.40 Kg ] │
│  Pilih Warna:  [ ▼ HITAM                        ] │
│                                                     │
│  Jumlah Roll Diambil:  [ 3  ] Roll                 │
│  Total Berat/Panjang:  [ 75.5 ] Kg                 │
│                                                     │
│  [ Stok tersedia: 126.0 Kg — warna HITAM ]        │
│                                                     │
│  [  Simpan Pemakaian (Stok Berkurang)  ]           │
└─────────────────────────────────────────────────────┘
```

## 5. API Endpoints

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| GET/POST | `/api/master/bahan` | CRUD Bahan (stok & hargaBeli = 0) |
| PUT/DELETE | `/api/master/bahan?id=xx` | Update / Hapus Bahan |
| GET/POST | `/api/purchase-order` | CRUD Surat Jalan Order |
| PUT/DELETE | `/api/purchase-order?id=xx` | Update / Hapus Order |
| PATCH | `/api/purchase-order/[id]` | Action: `order`, `terima`, `done`, `cancel` |
| GET/POST | `/api/material-usage` | CRUD Pemakaian Bahan |

## 6. Status Workflow

```
Draft ──[Kirim]──→ Ordered ──[Terima]──→ Received ──[Selesai]──→ Done
  │                   │                                              │
  └──[Cancel]──→ Cancelled     └──[Cancel]──→ Cancelled              │
                                                                     │
                    Stok bertambah di sini ←──────────────────────────┘
                    (Saat Received → Done: increment stock)
```
