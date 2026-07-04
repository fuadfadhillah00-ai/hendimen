<?php
// about.php - Halaman Tentang Hendimen
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tentang Kami - Hendimen</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        /* Gunakan style yang sama */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f5f7ff 0%, #eef2ff 100%); color: #1e293b; line-height: 1.6; }
        .container { max-width: 1000px; margin: 0 auto; padding: 40px 24px; }
        .legal-card { background: white; border-radius: 24px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
        h1 { color: #2D63A3; font-size: 2rem; margin-bottom: 8px; }
        .footer-links { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
        .footer-links a { color: #2D63A3; text-decoration: none; font-weight: 500; }
        .btn-back { display: inline-flex; align-items: center; gap: 8px; background: #2D63A3; color: white; padding: 10px 20px; border-radius: 40px; text-decoration: none; margin-bottom: 20px; font-weight: 500; }
        .team-grid { display: flex; gap: 30px; margin-top: 30px; flex-wrap: wrap; }
        .team-card { flex: 1; text-align: center; padding: 20px; background: #f8fafc; border-radius: 16px; }
        .team-avatar { width: 100px; height: 100px; background: linear-gradient(135deg, #2D63A3, #3A7BB0); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <a href="dashboard.html" class="btn-back"><i class="fas fa-arrow-left"></i> Kembali ke Dashboard</a>
        
        <div class="legal-card">
            <h1><i class="fas fa-info-circle"></i> Tentang Hendimen</h1>
            
            <h2>Visi Kami</h2>
            <p>Menjadi platform marketplace jasa terpercaya #1 di Indonesia yang menghubungkan masyarakat dengan helper profesional secara aman, cepat, dan transparan.</p>

            <h2>Misi Kami</h2>
            <ul>
                <li>✅ Memberikan solusi cepat bagi yang membutuhkan bantuan harian</li>
                <li>✅ Membuka lapangan pekerjaan bagi helper terampil</li>
                <li>✅ Menjamin keamanan transaksi dengan sistem escrow</li>
                <li>✅ Membangun ekosistem yang saling menguntungkan</li>
            </ul>

            <h2>Sejarah Hendimen</h2>
            <p>Hendimen lahir pada tahun 2025 dari keprihatinan melihat banyaknya masyarakat kesulitan mencari helper terpercaya untuk pekerjaan rumah tangga, pindahan, perbaikan, dan lain-lain. Kami ingin menciptakan platform yang aman dimana Requester dan Helper bisa bertransaksi tanpa khawatir penipuan.</p>


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