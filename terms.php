<?php
// terms.php - Halaman Syarat & Ketentuan Hendimen
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Syarat & Ketentuan - Hendimen</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* Gunakan style yang sama dengan privacy-policy.php */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f5f7ff 0%, #eef2ff 100%); color: #1e293b; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; padding: 40px 24px; }
        .legal-card { background: white; border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        h1 { color: #2D63A3; font-size: 2rem; margin-bottom: 8px; }
        .last-updated { color: #64748b; font-size: 0.85rem; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
        h2 { color: #1e293b; font-size: 1.3rem; margin: 28px 0 12px 0; padding-left: 12px; border-left: 4px solid #2D63A3; }
        h3 { color: #334155; font-size: 1.1rem; margin: 20px 0 8px 0; }
        p { color: #475569; margin-bottom: 12px; }
        ul, ol { margin: 12px 0 12px 24px; color: #475569; }
        li { margin-bottom: 6px; }
        .highlight { background: #f0f9ff; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #2D63A3; }
        .warning { background: #fef2f2; border-left-color: #dc2626; }
        .footer-links { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
        .footer-links a { color: #2D63A3; text-decoration: none; font-weight: 500; }
        .btn-back { display: inline-flex; align-items: center; gap: 8px; background: #2D63A3; color: white; padding: 10px 20px; border-radius: 40px; text-decoration: none; margin-bottom: 20px; font-weight: 500; }
        @media (max-width: 768px) { .legal-card { padding: 24px; } h1 { font-size: 1.5rem; } }
    </style>
</head>
<body>
    <div class="container">
        <a href="dashboard.html" class="btn-back"><i class="fas fa-arrow-left"></i> Kembali ke Dashboard</a>
        
        <div class="legal-card">
            <h1><i class="fas fa-file-contract"></i> Syarat & Ketentuan</h1>
            <div class="last-updated"><i class="fas fa-calendar-alt"></i> Berlaku efektif: 12 Juni 2026</div>

            <p>Dengan mengakses atau menggunakan platform Hendimen, Anda menyetujui Syarat & Ketentuan berikut. Jika tidak setuju, jangan gunakan platform kami.</p>

            <h2>1. Definisi</h2>
            <ul>
                <li><strong>Requester:</strong> Pengguna yang membutuhkan bantuan jasa dan memposting pekerjaan</li>
                <li><strong>Helper:</strong> Pengguna yang menawarkan jasa dan mengambil pekerjaan</li>
                <li><strong>Platform Hendimen:</strong> Website marketplace yang mempertemukan Requester dan Helper</li>
                <li><strong>Dana Escrow:</strong> Dana yang ditahan sementara hingga pekerjaan selesai</li>
            </ul>

            <h2>2. Pendaftaran Akun</h2>
            <ul>
                <li>✅ Minimal usia 18 tahun</li>
                <li>✅ Data diri yang didaftarkan harus valid dan benar</li>
                <li>✅ Satu orang hanya boleh memiliki SATU akun</li>
                <li>✅ Akun bersifat pribadi dan tidak boleh dipinjamkan</li>
                <li>❌ Dilarang membuat akun palsu atau menggunakan identitas orang lain</li>
            </ul>

            <h2>3. Verifikasi Identitas (KTP/SIM/KTM)</h2>
            <ul>
                <li>📄 Wajib bagi Requester yang akan melakukan top up & posting pekerjaan</li>
                <li>📄 Wajib bagi Helper yang akan menarik saldo</li>
                <li>🔒 Data KTP disimpan aman dan hanya untuk verifikasi</li>
                <li>⏱️ Proses verifikasi maksimal 1x24 jam</li>
            </ul>

            <h2>4. Top Up Saldo (Requester)</h2>
            <ul>
                <li>💰 Minimal top up: <strong>Rp 10.000</strong></li>
                <li>💰 Maksimal top up: <strong>Rp 1.000.000 per transaksi</strong></li>
                <li>🏦 Biaya admin top up: <strong>Rp 2.500 per transaksi</strong></li>
                <li>⏳ Proses top up manual: <strong>1x24 jam</strong> (verifikasi admin)</li>
                <li>✅ Top up via QRIS/Virtual Account akan langsung terproses</li>
                <li>❌ Saldo tidak bisa ditarik kembali (non-refundable)</li>
            </ul>

            <div class="highlight">
                <i class="fas fa-info-circle"></i> <strong>Catatan Penting:</strong> Saldo Requester hanya untuk membuat pekerjaan. Tidak bisa ditransfer ke rekening bank.
            </div>

            <h2>5. Membuat Pekerjaan (Requester)</h2>
            <ul>
                <li>📝 Deskripsi pekerjaan harus jelas dan jujur</li>
                <li>💰 Harga pekerjaan akan dihitung otomatis berdasarkan tingkat kesulitan</li>
                <li>🚨 Centang "Emergency" jika perlu prioritas (+Rp 10.000)</li>
                <li>💸 Biaya admin <strong>Rp 2.500</strong> akan dipotong dari saldo Requester</li>
                <li>🔒 Dana pekerjaan akan ditahan (escrow) hingga pekerjaan selesai</li>
            </ul>

            <h2>6. Mengambil Pekerjaan (Helper)</h2>
            <ul>
                <li>🤝 Helper hanya boleh mengambil pekerjaan yang mampu dikerjakan</li>
                <li>📸 Setelah selesai, Helper harus upload bukti foto pengerjaan</li>
                <li>⏰ Jika telat tanpa kabar > 3 hari, pekerjaan bisa dibatalkan</li>
                <li>⭐ Rating buruk akan mempengaruhi reputasi Helper</li>
            </ul>

            <h2>7. Penarikan Saldo (Helper)</h2>
            <ul>
                <li>💰 Minimal penarikan: <strong>Rp 50.000</strong></li>
                <li>🏦 Biaya admin penarikan: <strong>Rp 2.500 per transaksi</strong></li>
                <li>⏳ Proses penarikan: <strong>1-3 hari kerja</strong> (tergantung bank)</li>
                <li>📋 Wajib mengisi nomor rekening yang valid atas nama sendiri</li>
            </ul>

            <h2>8. Sistem Escrow & Penyelesaian Pekerjaan</h2>
            <ul>
                <li>🔒 Dana ditahan Hendimen sampai Helper upload bukti</li>
                <li>✅ Requester punya waktu <strong>3 hari</strong> untuk ACC atau Reject bukti</li>
                <li>✔️ Jika di-ACC, dana langsung ditransfer ke wallet Helper</li>
                <li>❌ Jika di-Reject, Helper harus upload ulang bukti</li>
                <li>⚖️ Jika sengketa, tim Hendimen akan memutuskan dalam 1x24 jam</li>
            </ul>

            <div class="highlight warning">
                <i class="fas fa-gavel"></i> <strong>Penyelesaian Sengketa:</strong> Jika Requester tidak merespon dalam 3 hari, dana otomatis akan cair ke Helper.
            </div>

            <h2>9. Hal yang Dilarang</h2>
            <ul>
                <li>🚫 Jasa ilegal (narkoba, perjudian, prostitusi, dll)</li>
                <li>🚫 Menawarkan jasa di luar platform untuk menghindari biaya admin</li>
                <li>🚫 Melakukan penipuan atau memanipulasi rating</li>
                <li>🚫 Menggunakan kata-kata kasar, SARA, atau ujaran kebencian di chat</li>
                <li>🚫 Membagikan kontak pribadi (WhatsApp, Telegram) sebelum pekerjaan ACC</li>
            </ul>

            <p><strong>Pelanggaran akan mengakibatkan:</strong> Peringatan → Pembekuan akun sementara → Penghapusan akun permanen + dana hangus.</p>

            <h2>10. Pembatalan & Refund</h2>
            <ul>
                <li>📌 Requester bisa membatalkan pekerjaan selama belum ada Helper yang mengambil</li>
                <li>📌 Jika sudah diambil, pembatalan harus kesepakatan kedua belah pihak</li>
                <li>💰 Dana akan dikembalikan ke wallet Requester jika dibatalkan (kecuali biaya admin)</li>
                <li>❌ Tidak ada refund untuk top up saldo</li>
            </ul>

            <h2>11. Tanggung Jawab Platform</h2>
            <ul>
                <li>Hendimen bertindak sebagai <strong>perantara</strong>, bukan pemberi jasa langsung</li>
                <li>Kualitas pekerjaan adalah tanggung jawab Helper</li>
                <li>Jika terjadi kerusakan/kerugian, Hendimen akan mediasi dan jika perlu memblokir akun bermasalah</li>
                <li>Hendimen tidak bertanggung jawab atas kerusakan di luar kewajaran</li>
            </ul>

            <h2>12. Penghentian Akun</h2>
            <ul>
                <li>Anda dapat menghapus akun kapan saja dengan menghubungi support</li>
                <li>Dana yang tersisa akan dikembalikan (dikurangi biaya admin)</li>
                <li>Hendimen berhak menghentikan akun jika melanggar aturan</li>
            </ul>

            <h2>13. Perubahan Syarat & Ketentuan</h2>
            <p>Kami dapat mengubah Syarat & Ketentuan. Perubahan akan diumumkan melalui email atau notifikasi. Penggunaan lanjutan setelah perubahan berarti Anda menyetujui perubahan tersebut.</p>

            <h2>14. Hukum yang Berlaku</h2>
            <p>Syarat & Ketentuan ini tunduk pada hukum Negara Kesatuan Republik Indonesia. Setiap sengketa akan diselesaikan di Pengadilan Negeri Pekanbaru.</p>

            <div class="highlight">
                <p><strong><i class="fas fa-question-circle"></i> Ada pertanyaan?</strong> Hubungi kami:</p>
                <p><i class="fas fa-envelope"></i> support@hendimen.com | <i class="fab fa-whatsapp"></i> 0812-3456-7890</p>
            </div>

            <div class="footer-links">
                <a href="privacy-policy.php">Kebijakan Privasi</a>
                <a href="terms.php">Syarat & Ketentuan</a>
                <a href="about.php">Tentang Kami</a>
                <a href="contact.php">Bantuan</a>
            </div>
        </div>
    </div>
</body>
</html>