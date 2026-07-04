<?php
// privacy-policy.php - Halaman Kebijakan Privasi Hendimen
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kebijakan Privasi - Hendimen</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #f5f7ff 0%, #eef2ff 100%);
            color: #1e293b;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 24px;
        }
        .legal-card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
        }
        h1 {
            color: #2D63A3;
            font-size: 2rem;
            margin-bottom: 8px;
        }
        .last-updated {
            color: #64748b;
            font-size: 0.85rem;
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e2e8f0;
        }
        h2 {
            color: #1e293b;
            font-size: 1.3rem;
            margin: 28px 0 12px 0;
            padding-left: 12px;
            border-left: 4px solid #2D63A3;
        }
        h3 {
            color: #334155;
            font-size: 1.1rem;
            margin: 20px 0 8px 0;
        }
        p {
            color: #475569;
            margin-bottom: 12px;
        }
        ul, ol {
            margin: 12px 0 12px 24px;
            color: #475569;
        }
        li {
            margin-bottom: 6px;
        }
        .highlight {
            background: #f0f9ff;
            padding: 16px;
            border-radius: 12px;
            margin: 20px 0;
            border-left: 4px solid #2D63A3;
        }
        .footer-links {
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 24px;
            justify-content: center;
        }
        .footer-links a {
            color: #2D63A3;
            text-decoration: none;
            font-weight: 500;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
        .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #2D63A3;
            color: white;
            padding: 10px 20px;
            border-radius: 40px;
            text-decoration: none;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .btn-back:hover {
            background: #1a4a7a;
        }
        @media (max-width: 768px) {
            .legal-card { padding: 24px; }
            h1 { font-size: 1.5rem; }
            h2 { font-size: 1.1rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="dashboard.html" class="btn-back">
            <i class="fas fa-arrow-left"></i> Kembali ke Dashboard
        </a>
        
        <div class="legal-card">
            <h1><i class="fas fa-shield-alt"></i> Kebijakan Privasi</h1>
            <div class="last-updated">
                <i class="fas fa-calendar-alt"></i> Terakhir diperbarui: 12 Juni 2026
            </div>

            <p>Hendimen ("kami", "kita", atau "platform") berkomitmen untuk melindungi data pribadi Anda. Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat menggunakan platform Hendimen.</p>

            <div class="highlight">
                <i class="fas fa-info-circle"></i> <strong>Ringkasan Penting:</strong> Data Anda hanya digunakan untuk verifikasi identitas, proses transaksi, dan meningkatkan keamanan platform. Kami tidak akan pernah menjual data Anda kepada pihak ketiga.
            </div>

            <h2>1. Informasi yang Kami Kumpulkan</h2>
            
            <h3>a. Informasi Akun</h3>
            <ul>
                <li><strong>Nama Lengkap</strong> - Untuk identifikasi pengguna</li>
                <li><strong>Alamat Email</strong> - Untuk komunikasi dan verifikasi akun</li>
                <li><strong>Nomor Telepon</strong> - Untuk verifikasi dan notifikasi</li>
                <li><strong>Foto KTP/SIM/KTM</strong> - Untuk verifikasi identitas (hanya untuk keamanan transaksi)</li>
            </ul>

            <h3>b. Informasi Transaksi</h3>
            <ul>
                <li><strong>Data Top Up</strong> - Jumlah, metode pembayaran, dan waktu transaksi</li>
                <li><strong>Data Penarikan Saldo</strong> - Nomor rekening bank tujuan, jumlah penarikan</li>
                <li><strong>Riwayat Pekerjaan</strong> - Pekerjaan yang dibuat atau diambil</li>
            </ul>

            <h3>c. Informasi Teknis</h3>
            <ul>
                <li><strong>Alamat IP</strong> - Untuk keamanan dan pencegahan penyalahgunaan</li>
                <li><strong>Data Lokasi</strong> - Untuk menampilkan pekerjaan di sekitar Anda (dengan izin Anda)</li>
                <li><strong>Data Perangkat</strong> - Untuk optimalisasi tampilan website</li>
            </ul>

            <h2>2. Bagaimana Kami Menggunakan Informasi Anda</h2>
            <ul>
                <li>✅ Memverifikasi identitas Anda untuk mencegah penipuan</li>
                <li>✅ Memproses top up saldo dan penarikan dana</li>
                <li>✅ Menghubungkan Requester dengan Helper yang sesuai</li>
                <li>✅ Mengirim notifikasi tentang status pekerjaan</li>
                <li>✅ Meningkatkan keamanan dan pengalaman platform</li>
                <li>✅ Mematuhi peraturan perundang-undangan yang berlaku</li>
            </ul>

            <h2>3. Perlindungan Data KTP</h2>
            <p>Foto KTP yang Anda unggah:</p>
            <ul>
                <li>🔒 Disimpan dengan enkripsi di server yang aman</li>
                <li>👁️ Hanya dapat diakses oleh admin Hendimen yang terverifikasi</li>
                <li>🗑️ Akan dihapus secara otomatis setelah 30 hari jika akun tidak diverifikasi</li>
                <li>📋 Tidak akan pernah dibagikan ke Helper atau pihak lain tanpa izin</li>
            </ul>

            <h2>4. Keamanan Data</h2>
            <p>Kami menerapkan langkah-langkah keamanan berikut:</p>
            <ul>
                <li>🔐 Enkripsi SSL (HTTPS) untuk semua komunikasi data</li>
                <li>💾 Backup database secara rutin</li>
                <li>🛡️ Firewall dan proteksi malware di server Hostinger</li>
                <li>🔑 Password disimpan dengan hashing (bcrypt)</li>
                <li>📱 Notifikasi keamanan untuk login dari perangkat baru</li>
            </ul>

            <h2>5. Berbagi Data dengan Pihak Ketiga</h2>
            <p>Kami hanya berbagi data dalam situasi berikut:</p>
            <ul>
                <li><strong>Payment Gateway:</strong> Informasi transaksi dikirim ke Midtrans/Xendit untuk pemrosesan pembayaran</li>
                <li><strong>Penegakan Hukum:</strong> Jika diminta oleh instansi berwenang yang sah</li>
                <li><strong>Perlindungan Platform:</strong> Jika terjadi pelanggaran Syarat & Ketentuan</li>
            </ul>
            <p><strong>Kami TIDAK pernah menjual data pribadi Anda ke pihak manapun.</strong></p>

            <h2>6. Hak Anda sebagai Pengguna</h2>
            <ul>
                <li>📖 <strong>Hak Akses</strong> - Anda dapat melihat data Anda di halaman Profil</li>
                <li>✏️ <strong>Hak Perbaiki</strong> - Anda dapat mengupdate informasi akun</li>
                <li>🗑️ <strong>Hak Hapus</strong> - Anda dapat meminta penghapusan akun dengan menghubungi support</li>
                <li>📤 <strong>Hak Ekspor Data</strong> - Anda dapat meminta salinan data Anda</li>
            </ul>

            <h2>7. Data Anak-anak</h2>
            <p>Platform Hendimen hanya untuk pengguna berusia minimal 18 tahun. Kami tidak dengan sengaja mengumpulkan data anak-anak. Jika Anda orang tua/wali dan mengetahui anak Anda menggunakan platform kami, hubungi kami untuk menghapus akun tersebut.</p>

            <h2>8. Perubahan Kebijakan Privasi</h2>
            <p>Kami dapat memperbarui kebijakan ini dari waktu ke waktu. Perubahan signifikan akan diinformasikan melalui email atau notifikasi di dashboard. Silakan cek halaman ini secara berkala.</p>

            <h2>9. Kontak Kami</h2>
            <div class="highlight">
                <p><strong><i class="fas fa-envelope"></i> Email:</strong> support@hendimen.com</p>
                <p><strong><i class="fab fa-whatsapp"></i> WhatsApp:</strong> 0812-3456-7890</p>
                <p><strong><i class="fas fa-clock"></i> Jam Operasional:</strong> Senin - Jumat, 09:00 - 17:00 WIB</p>
                <p><strong><i class="fas fa-map-marker-alt"></i> Alamat Kantor:</strong> [Alamat lengkap perusahaan Anda]</p>
            </div>

            <div class="footer-links">
                <a href="privacy-policy.php"><i class="fas fa-shield-alt"></i> Kebijakan Privasi</a>
                <a href="terms.php"><i class="fas fa-file-contract"></i> Syarat & Ketentuan</a>
                <a href="about.php"><i class="fas fa-info-circle"></i> Tentang Kami</a>
                <a href="contact.php"><i class="fas fa-headset"></i> Bantuan</a>
            </div>
        </div>
    </div>
</body>
</html>