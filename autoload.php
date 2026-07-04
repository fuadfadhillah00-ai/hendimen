<?php
// autoload.php - Manual autoloader untuk Firebase PHP
// Tanpa Composer!

spl_autoload_register(function ($class) {
    // Prefix namespace Firebase
    $prefix = 'Kreait\\Firebase\\';
    $base_dir = __DIR__ . '/firebase-php/src/';
    
    // Cek apakah class menggunakan namespace Firebase
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    // Ambil nama class relatif
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

// Tambahan autoload untuk dependency lain
spl_autoload_register(function ($class) {
    // Google Auth
    $prefixes = [
        'Google\\' => __DIR__ . '/firebase-php/vendor/google/auth/src/',
        'GuzzleHttp\\' => __DIR__ . '/firebase-php/vendor/guzzlehttp/guzzle/src/',
        'Psr\\' => __DIR__ . '/firebase-php/vendor/psr/',
        'Firebase\\' => __DIR__ . '/firebase-php/vendor/firebase/',
    ];
    
    foreach ($prefixes as $prefix => $base_dir) {
        $len = strlen($prefix);
        if (strncmp($prefix, $class, $len) !== 0) {
            continue;
        }
        $relative_class = substr($class, $len);
        $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
        if (file_exists($file)) {
            require $file;
        }
    }
});