<?php
// generate_keystore.php - Generate keystore dan tampilkan SHA
// Jalankan di browser: https://hendimen.my.id/generate_keystore.php

echo "<pre>";
echo "🚀 GENERATE KEYSTORE DAN SHA PERMANEN\n";
echo "========================================\n\n";

// ================================================================
// 1. CEK APAKAH KEYTOOL TERSEDIA
// ================================================================
$keytool = shell_exec('which keytool 2>/dev/null');
if (empty($keytool)) {
    // Coba path umum
    $paths = [
        '/usr/bin/keytool',
        '/usr/local/bin/keytool',
        '/opt/jdk/bin/keytool',
        '/Library/Java/JavaVirtualMachines/*/Contents/Home/bin/keytool'
    ];
    foreach ($paths as $path) {
        if (file_exists($path) || strpos($path, '*') !== false) {
            $keytool = $path;
            break;
        }
    }
}

if (empty($keytool)) {
    die("❌ keytool tidak ditemukan!\nPastikan Java JDK terinstall.\n");
}

echo "✅ keytool ditemukan: " . $keytool . "\n\n";

// ================================================================
// 2. BUAT KEYSTORE
// ================================================================
$keystoreName = "hendimen-release.keystore";
$password = "Hendimen2025";
$alias = "hendimen";
$validity = 10000;

echo "📁 1. MEMBUAT KEYSTORE...\n";

$cmd = "keytool -genkey -v " .
       "-keystore $keystoreName " .
       "-alias $alias " .
       "-keyalg RSA -keysize 2048 -validity $validity " .
       "-storepass $password -keypass $password " .
       "-dname \"CN=Hendimen, OU=Dev, O=Hendimen, L=Pekanbaru, ST=Riau, C=ID\"";

exec($cmd . " 2>&1", $output, $returnCode);

if ($returnCode === 0) {
    echo "✅ Keystore berhasil dibuat: $keystoreName\n\n";
} else {
    echo "❌ Gagal membuat keystore\n";
    echo "Error: " . implode("\n", $output) . "\n";
    exit(1);
}

// ================================================================
// 3. TAMPILKAN SHA
// ================================================================
echo "🔑 2. MENDAPATKAN SHA FINGERPRINT...\n\n";

$cmd = "keytool -list -v -keystore $keystoreName -alias $alias -storepass $password";
exec($cmd . " 2>&1", $output, $returnCode);

if ($returnCode === 0) {
    $outputStr = implode("\n", $output);
    
    // Extract SHA1
    preg_match('/SHA1:\s*([A-F0-9:]+)/', $outputStr, $matches);
    $sha1 = $matches[1] ?? 'Tidak ditemukan';
    
    // Extract SHA256
    preg_match('/SHA256:\s*([A-F0-9:]+)/', $outputStr, $matches);
    $sha256 = $matches[1] ?? 'Tidak ditemukan';
    
    // Extract MD5
    preg_match('/MD5:\s*([A-F0-9:]+)/', $outputStr, $matches);
    $md5 = $matches[1] ?? 'Tidak ditemukan';
    
    echo "📋 SHA-1   : $sha1\n";
    echo "📋 SHA-256 : $sha256\n";
    echo "📋 MD5     : $md5\n";
    
    // ================================================================
    // 4. SIMPAN KE FILE
    // ================================================================
    $info = "========================================\n";
    $info .= "HENDIMEN KEYSTORE INFO\n";
    $info .= "========================================\n";
    $info .= "Keystore: $keystoreName\n";
    $info .= "Password: $password\n";
    $info .= "Alias: $alias\n";
    $info .= "Key Password: $password\n";
    $info .= "Validitas: $validity hari\n";
    $info .= "----------------------------------------\n";
    $info .= "SHA-1   : $sha1\n";
    $info .= "SHA-256 : $sha256\n";
    $info .= "MD5     : $md5\n";
    $info .= "========================================\n";
    
    file_put_contents("keystore_info.txt", $info);
    echo "\n✅ Info disimpan ke: keystore_info.txt\n";
    
} else {
    echo "❌ Gagal membaca fingerprint\n";
    echo implode("\n", $output) . "\n";
}

echo "\n========================================\n";
echo "✅ SELESAI!\n";
echo "\n📁 Keystore: $keystoreName\n";
echo "🔑 Password: $password\n";
echo "📌 Alias: $alias\n";
echo "\n📌 SIMPAN INFORMASI INI DI TEMPAT AMAN!\n";
echo "========================================\n";
echo "</pre>";
?>