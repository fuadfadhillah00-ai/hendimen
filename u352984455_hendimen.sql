-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 04, 2026 at 10:59 PM
-- Server version: 11.8.8-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u352984455_hendimen`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_logs`
--

CREATE TABLE `admin_logs` (
  `id` int(11) NOT NULL,
  `admin_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_conversations`
--

CREATE TABLE `chat_conversations` (
  `id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `helper_id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `last_message` text DEFAULT NULL,
  `last_message_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `helper_unread_count` int(11) DEFAULT 0,
  `requester_unread_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_conversations`
--

INSERT INTO `chat_conversations` (`id`, `job_id`, `helper_id`, `requester_id`, `last_message`, `last_message_time`, `helper_unread_count`, `requester_unread_count`, `created_at`, `updated_at`) VALUES
(174, 488, 29, 44, 'apa', '2026-07-04 21:43:34', 0, 0, '2026-07-04 20:24:42', '2026-07-04 21:44:12');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `job_id`, `sender_id`, `receiver_id`, `message`, `is_read`, `created_at`) VALUES
(91, 488, 29, 44, 'Woi pantang', 1, '2026-07-04 20:24:42'),
(92, 488, 44, 29, 'apa', 1, '2026-07-04 21:42:45'),
(93, 488, 44, 29, 'woi', 1, '2026-07-04 21:43:26'),
(94, 488, 44, 29, 'apa', 1, '2026-07-04 21:43:34');

--
-- Triggers `chat_messages`
--
DELIMITER $$
CREATE TRIGGER `after_chat_message_insert` AFTER INSERT ON `chat_messages` FOR EACH ROW BEGIN
    DECLARE helper_id_val INT;
    DECLARE requester_id_val INT;
    
    -- Dapatkan helper_id dan requester_id dari jobs
    SELECT helper_id, user_id INTO helper_id_val, requester_id_val
    FROM jobs WHERE id = NEW.job_id;
    
    -- Update conversation atau insert jika belum ada
    INSERT INTO chat_conversations (job_id, helper_id, requester_id, last_message, last_message_time)
    VALUES (NEW.job_id, helper_id_val, requester_id_val, NEW.message, NEW.created_at)
    ON DUPLICATE KEY UPDATE
        last_message = NEW.message,
        last_message_time = NEW.created_at;
    
    -- Update unread count untuk receiver
    IF NEW.sender_id = helper_id_val THEN
        UPDATE chat_conversations 
        SET requester_unread_count = requester_unread_count + 1
        WHERE job_id = NEW.job_id AND helper_id = helper_id_val AND requester_id = requester_id_val;
    ELSE
        UPDATE chat_conversations 
        SET helper_unread_count = helper_unread_count + 1
        WHERE job_id = NEW.job_id AND helper_id = helper_id_val AND requester_id = requester_id_val;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fcm_tokens`
--

CREATE TABLE `fcm_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(500) NOT NULL,
  `device_type` varchar(20) DEFAULT 'android',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fcm_tokens`
--

INSERT INTO `fcm_tokens` (`id`, `user_id`, `token`, `device_type`, `created_at`, `updated_at`) VALUES
(11, 0, 'eJxzeNUUSxqXJkqqJ4PFCD:APA91bEBzdbQhiYxqU5VG3tUdLFR-JfkELeeq97kL0VfaJ8JAoqh7OzVJFOSjkxsrFgZGc6GwJaPYP9K2zAH98IkMGxsTFKwo7in1szh5-IrAsT_cwXxDxE', 'android', '2026-06-30 06:33:53', '2026-07-04 21:03:32'),
(12, 29, 'fMnNYT2VStaX2u9Aq3HdD2:APA91bFUK6oPLt5vydsxWI42_KH6g24fh6393gE3M-OZ19QbQwtRrOfqll_hfWgHliO-lWTtjGAseao2lctLBryiypIxVvUV2zhcLKW15BCayEsn57Xxg0M', 'android', '2026-06-30 06:55:57', '2026-07-04 06:55:06'),
(13, 0, 'ecgsnF21Rve423JkT5E_8I:APA91bE2AMov7aLbg8DqwxBWawfyYD4FRI2FoYalFbgwcBOmRppwSLbYh9lbRQhTxL51f02EdQQQFva51YO2B4kN9z6okhQ9d6uyCGIVCvn_IeXsYtGynvA', 'android', '2026-06-30 16:55:22', '2026-06-30 16:55:22'),
(14, 0, 'fnMAnaCyR1CDqNtHsEf7-3:APA91bHYkYIMgp0Fcz-2C2PgHvDBnDJnW0WQQn8Xi3pE7_AYaNYZqw66ag5MuaTBJCcjHcmxKx9pqbsIkiZF672aUtGtEUUZIwlwKGA-vfAm4cvbMANRa7Y', 'android', '2026-06-30 17:02:16', '2026-06-30 17:07:09'),
(15, 29, 'ceDQnGDwQrmamfGFGRvBg7:APA91bFzfWZHvl3E_oqXggY2Hhf2VQ1pGLq83CZPWGZKnsazlhZAd9a2bMKGKbG13q6gxgIAieD8wahwshtXXL1mqEYOS8vkYqBgDMwXU3L-LW2X_jb76z4', 'android', '2026-07-04 21:41:48', '2026-07-04 22:07:47');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `helper_id` int(11) DEFAULT NULL,
  `selected_offer_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `location` varchar(255) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `price` decimal(15,2) NOT NULL,
  `deal_price` decimal(15,2) DEFAULT NULL,
  `budget_min` decimal(15,2) DEFAULT NULL,
  `budget_max` decimal(15,2) DEFAULT NULL,
  `tip` decimal(15,2) DEFAULT 0.00,
  `komisi_persen` decimal(5,2) DEFAULT 5.00,
  `komisi_nominal` decimal(15,2) DEFAULT 0.00,
  `status` enum('open','offered','selected','paid','in-progress','pending_acc','perbaikan','completed','cancelled') DEFAULT 'open',
  `emergency` tinyint(1) DEFAULT 0,
  `distance` varchar(20) DEFAULT '0.5 km',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `image_path` varchar(500) DEFAULT NULL,
  `completion_image` varchar(255) DEFAULT NULL,
  `reject_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `user_id`, `helper_id`, `selected_offer_id`, `title`, `category`, `description`, `location`, `latitude`, `longitude`, `price`, `deal_price`, `budget_min`, `budget_max`, `tip`, `komisi_persen`, `komisi_nominal`, `status`, `emergency`, `distance`, `created_at`, `updated_at`, `image_path`, `completion_image`, `reject_reason`) VALUES
(469, 44, 29, NULL, 'Perbaikan AC Rumah - Job #1', 'perbaikan', 'AC rumah mati total, perlu service dan isi freon. Lokasi di perumahan.', 'Jl. Sudirman No. 123, Pekanbaru', 0.52940000, 101.44320000, 100000.00, NULL, NULL, NULL, 0.00, 5.00, 5000.00, 'completed', 0, '0.5 km', '2026-06-24 07:04:38', '2026-06-24 07:06:09', NULL, 'uploads/completion/completion_469_1782284756.jpg', NULL),
(470, 44, 29, NULL, 'Pindahan Rumah - Job #2', 'moving', 'Pindahan rumah dari Apartemen ke Rumah. Barang: 1 set sofa, 2 kasur, 4 kardus, dan 1 kulkas. Butuh 2 helper.', 'Jl. Raya Pekanbaru No. 45, Pekanbaru', 0.52000000, 101.45000000, 150000.00, NULL, NULL, NULL, 10000.00, 5.00, 7500.00, 'completed', 0, '0.5 km', '2026-06-24 07:06:19', '2026-06-25 12:27:10', NULL, 'uploads/completion/completion_470_1782284821.jpg', NULL),
(471, 44, NULL, NULL, 'Servis AC Darurat - Job #3 ????', 'perbaikan', 'AC ruang tamu mati total, suhu ruangan 35°C. BUTUH SEGERA! Ada bayi di rumah.', 'Jl. Nangka No. 78, Pekanbaru', 0.53500000, 101.44800000, 75000.00, NULL, NULL, NULL, 0.00, 5.00, 3750.00, '', 1, '0.5 km', '2026-06-24 07:06:52', '2026-06-28 10:11:29', NULL, NULL, NULL),
(486, 44, 29, 5, 'Perbaikan nehi nehi', 'perbaikan', 'Sacasc', 'asvas', -6.20880000, 106.84560000, 45000.00, NULL, 10000.00, 50000.00, 0.00, 5.00, 0.00, 'completed', 0, '0.5 km', '2026-07-04 04:04:42', '2026-07-04 19:57:26', NULL, 'uploads/completion/completion_486_1783195036.jpg', NULL),
(487, 44, NULL, NULL, 'aksnclaks', 'perbaikan', 'saas', 'asvas', -6.20880000, 106.84560000, 400000.00, NULL, 100000.00, 400000.00, 0.00, 5.00, 0.00, 'open', 0, '0.5 km', '2026-07-04 19:58:34', '2026-07-04 19:58:34', NULL, NULL, NULL),
(488, 44, 29, 7, 'aksnclaks', 'pindahan', 'asfa', 'sava', -6.20880000, 106.84560000, 30000.00, NULL, 100000.00, 400000.00, 0.00, 5.00, 0.00, 'paid', 0, '0.5 km', '2026-07-04 20:02:35', '2026-07-04 20:03:50', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `job_reports`
--

CREATE TABLE `job_reports` (
  `id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `reporter_id` int(11) NOT NULL,
  `reporter_role` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_reports`
--

INSERT INTO `job_reports` (`id`, `job_id`, `reporter_id`, `reporter_role`, `message`, `status`, `created_at`) VALUES
(1, 101, 26, 'requester', 'beuuuu', 'open', '2026-06-11 08:44:43');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('payment','pending_acc','reject','info','warning','success','admin','job_taken','reminder_pending_acc','reminder_in_progress','low_balance') DEFAULT 'info',
  `job_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `job_id`, `title`, `message`, `is_read`, `data`, `created_at`) VALUES
(3563, 29, 'info', NULL, 'Penarikan Saldo', '???? Permintaan penarikan Rp 100.000 ke rekening BCA (****1241) diajukan. Dana masuk rekening: Rp 97.500 (setelah admin Rp 2.500)', 0, NULL, '2026-07-05 01:28:28'),
(3564, 40, 'admin', NULL, 'Withdraw Request', '???? Permintaan withdraw dari User ID 29 (helper) sebesar Rp 100.000 ke rekening BCA (2141241 - Rifki Arohman)', 0, NULL, '2026-07-05 01:28:28'),
(3565, 29, 'info', NULL, 'Withdraw Ditolak', '❌ Penarikan saldo Rp 100.000 ditolak.\nAlasan: gapapa\n\nSaldo Anda telah dikembalikan sebesar Rp 102.500', 0, NULL, '2026-07-05 01:33:12'),
(3566, 29, 'info', NULL, 'Penarikan Saldo - Pending', '???? Permintaan penarikan Rp 100.000 ke rekening BCA (****1241) diajukan. Menunggu verifikasi admin. Dana akan masuk rekening: Rp 97.500 (setelah admin Rp 2.500)', 0, NULL, '2026-07-05 01:39:29'),
(3567, 40, 'admin', NULL, 'Withdraw Request - Pending', '???? Permintaan withdraw dari User ID 29 (helper) sebesar Rp 100.000 ke rekening BCA (2141241 - Rifki Arohman)', 0, NULL, '2026-07-05 01:39:29'),
(3568, 29, 'info', NULL, 'Withdraw Berhasil', '✅ Penarikan saldo Rp 100.000 telah berhasil diproses dan ditransfer ke rekening Anda. (Admin fee: Rp 2.500)', 0, NULL, '2026-07-05 01:45:17'),
(3569, 29, 'info', NULL, 'Penarikan Saldo - Pending', '???? Permintaan penarikan Rp 120.000 ke rekening BCA (****3737) diajukan. Menunggu verifikasi admin. Dana akan masuk rekening: Rp 117.500 (setelah admin Rp 2.500)', 0, NULL, '2026-07-05 01:45:45'),
(3570, 40, 'admin', NULL, 'Withdraw Request - Pending', '???? Permintaan withdraw dari User ID 29 (helper) sebesar Rp 120.000 ke rekening BCA (273737 - Rifki)', 0, NULL, '2026-07-05 01:45:45'),
(3571, 29, 'info', NULL, 'Withdraw Ditolak', '❌ Penarikan saldo Rp 120.000 ditolak.\nAlasan: gapapa\n\nSaldo Anda tidak berubah karena belum dipotong.', 0, NULL, '2026-07-05 01:45:54'),
(3572, 29, 'info', NULL, 'Penarikan Saldo - Pending', '???? Permintaan penarikan Rp 120.000 ke rekening BCA (****3737) diajukan. Menunggu verifikasi admin. Dana akan masuk rekening: Rp 117.500 (setelah admin Rp 2.500)', 0, NULL, '2026-07-05 01:49:17'),
(3573, 40, 'admin', NULL, 'Withdraw Request - Pending', '???? Permintaan withdraw dari User ID 29 (helper) sebesar Rp 120.000 ke rekening BCA (273737 - Rifki)', 0, NULL, '2026-07-05 01:49:17'),
(3574, 29, 'info', NULL, 'Withdraw Ditolak', '❌ Penarikan saldo Rp 120.000 ditolak.\nAlasan: gpp\n\nSaldo Anda tidak berubah karena belum dipotong.', 0, NULL, '2026-07-05 01:50:13'),
(3575, 29, 'info', NULL, 'Penarikan Saldo - Pending', '???? Permintaan penarikan Rp 120.000 ke rekening BCA (****3737) diajukan. Menunggu verifikasi admin. Dana akan masuk rekening: Rp 117.500 (setelah admin Rp 2.500)', 0, NULL, '2026-07-05 01:50:43'),
(3576, 40, 'admin', NULL, 'Withdraw Request - Pending', '???? Permintaan withdraw dari User ID 29 (helper) sebesar Rp 120.000 ke rekening BCA (273737 - Rifki)', 0, NULL, '2026-07-05 01:50:43'),
(3577, 29, 'info', NULL, 'Withdraw Berhasil', '✅ Penarikan saldo Rp 120.000 telah berhasil diproses dan ditransfer ke rekening Anda. (Admin fee: Rp 2.500)', 0, NULL, '2026-07-05 01:50:47'),
(3578, 29, 'info', NULL, 'Penarikan Saldo - Pending', '???? Permintaan penarikan Rp 120.000 ke rekening BCA (****3737) diajukan. Menunggu verifikasi admin. Dana akan masuk rekening: Rp 117.500 (setelah admin Rp 2.500)', 0, NULL, '2026-07-05 01:57:36'),
(3579, 40, 'admin', NULL, 'Withdraw Request - Pending', '???? Permintaan withdraw dari User ID 29 (helper) sebesar Rp 120.000 ke rekening BCA (273737 - Rifki)', 0, NULL, '2026-07-05 01:57:36'),
(3580, 29, 'info', NULL, 'Withdraw Ditolak', '❌ Penarikan saldo Rp 120.000 ditolak.\nAlasan: gpp\n\nSaldo Anda tidak berubah karena belum dipotong.', 0, NULL, '2026-07-05 01:57:52'),
(3581, 29, 'info', NULL, 'Penarikan Saldo - Pending', '???? Permintaan penarikan Rp 120.000 ke rekening BCA (****3737) diajukan. Menunggu verifikasi admin. Dana akan masuk rekening: Rp 117.500 (setelah admin Rp 2.500)', 0, NULL, '2026-07-05 01:59:17'),
(3582, 40, 'admin', NULL, 'Withdraw Request - Pending', '???? Permintaan withdraw dari User ID 29 (helper) sebesar Rp 120.000 ke rekening BCA (273737 - Rifki)', 0, NULL, '2026-07-05 01:59:17'),
(3583, 29, 'info', NULL, 'Withdraw Berhasil', '✅ Penarikan saldo Rp 120.000 telah berhasil diproses dan ditransfer ke rekening Anda. (Admin fee: Rp 2.500)', 0, NULL, '2026-07-05 01:59:29'),
(3584, 44, '', 486, '', '???? helper menawar pekerjaan \"Perbaikan nehi nehi\" sebesar Rp 45.000. Pesan: Bisa kan?', 0, NULL, '2026-07-04 19:54:26'),
(3585, 44, '', 486, '', '???? Fuad Fadhillah menawar pekerjaan \"Perbaikan nehi nehi\" sebesar Rp 70.000. Pesan: Bisa?', 0, NULL, '2026-07-04 19:54:51'),
(3586, 8, 'reject', 486, '', '❌ Tawaran Anda untuk \"Perbaikan nehi nehi\" ditolak oleh Requester.', 0, NULL, '2026-07-04 19:55:25'),
(3587, 29, 'success', 486, '', '???? Selamat! Tawaran Anda untuk \"Perbaikan nehi nehi\" dipilih! Silakan tunggu instruksi pembayaran dari Requester.', 0, NULL, '2026-07-04 19:55:59'),
(3588, 44, 'info', 486, '', '✅ Anda telah memilih tawaran dari  sebesar Rp 45.000 untuk \"Perbaikan nehi nehi\". Silakan lakukan pembayaran untuk mulai pekerjaan.', 0, NULL, '2026-07-04 19:55:59'),
(3589, 29, 'payment', 486, '', '???? Pembayaran untuk \"Perbaikan nehi nehi\" telah diterima! Silakan mulai bekerja.', 0, NULL, '2026-07-04 19:56:04'),
(3590, 44, 'info', 486, '', '???? Helper sudah mulai mengerjakan \"Perbaikan nehi nehi\".', 0, NULL, '2026-07-04 19:56:34'),
(3591, 44, 'pending_acc', 486, '', '???? Helper telah mengupload ULANG bukti penyelesaian untuk pekerjaan \"Perbaikan nehi nehi\". Silakan review kembali dan ACC untuk transfer dana.', 0, NULL, '2026-07-04 19:56:52'),
(3592, 29, 'reject', 486, '', '⚠️ Pekerjaan \"Perbaikan nehi nehi\" ditolak. Alasan: gapapa', 0, NULL, '2026-07-04 19:57:07'),
(3593, 44, 'pending_acc', 486, '', '???? Helper telah mengupload ULANG bukti penyelesaian untuk pekerjaan \"Perbaikan nehi nehi\". Silakan review kembali dan ACC untuk transfer dana.', 0, NULL, '2026-07-04 19:57:16'),
(3594, 29, 'payment', 486, '', '???? Pekerjaan \"Perbaikan nehi nehi\" telah disetujui! Rp 42.750 masuk ke wallet Helper Anda. (Potongan 5%: Rp 2.250)', 0, NULL, '2026-07-04 19:57:26'),
(3595, 6, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3596, 8, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3597, 11, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3598, 15, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3599, 16, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3600, 21, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3601, 22, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3602, 23, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3603, 24, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3604, 25, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3605, 26, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3606, 29, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3607, 30, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3608, 31, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3609, 32, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3610, 33, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3611, 34, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3612, 35, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3613, 36, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3614, 41, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3615, 42, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3616, 43, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3617, 44, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3618, 45, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3619, 46, '', 487, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 19:58:34'),
(3620, 44, 'info', 487, '', '✅ Pekerjaan \"aksnclaks\" berhasil diposting!\n\n???? Budget: Rp 100.000 - Rp 400.000\n???? Status: Menunggu tawaran dari Helper\n⏰ Masa pemilihan tawaran: 24 jam', 0, NULL, '2026-07-04 19:58:34'),
(3621, 6, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3622, 8, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3623, 11, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3624, 15, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3625, 16, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3626, 21, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3627, 22, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3628, 23, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3629, 24, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3630, 25, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3631, 26, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3632, 29, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3633, 30, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3634, 31, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3635, 32, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3636, 33, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3637, 34, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3638, 35, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3639, 36, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3640, 41, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3641, 42, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3642, 43, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3643, 44, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3644, 45, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3645, 46, '', 488, '', '???? Pekerjaan baru: aksnclaks - Budget: Rp 100.000 - Rp 400.000', 0, NULL, '2026-07-04 20:02:35'),
(3646, 44, 'info', 488, '', '✅ Pekerjaan \"aksnclaks\" berhasil diposting!\n\n???? Budget: Rp 100.000 - Rp 400.000\n???? Status: Menunggu tawaran dari Helper\n⏰ Masa pemilihan tawaran: 24 jam', 0, NULL, '2026-07-04 20:02:35'),
(3647, 44, '', 488, '', '???? helper menawar pekerjaan \"aksnclaks\" sebesar Rp 30.000. Pesan: Gimana?', 0, NULL, '2026-07-04 20:03:34'),
(3648, 29, 'success', 488, '', '???? Selamat! Tawaran Anda untuk \"aksnclaks\" dipilih! Silakan tunggu instruksi pembayaran dari Requester.', 0, NULL, '2026-07-04 20:03:44'),
(3649, 44, 'info', 488, '', '✅ Anda telah memilih tawaran dari  sebesar Rp 30.000 untuk \"aksnclaks\". Silakan lakukan pembayaran untuk mulai pekerjaan.', 0, NULL, '2026-07-04 20:03:44'),
(3650, 29, 'payment', 488, '', '???? Pembayaran untuk \"aksnclaks\" telah diterima! Silakan mulai bekerja.', 0, NULL, '2026-07-04 20:03:50');

-- --------------------------------------------------------

--
-- Table structure for table `offers`
--

CREATE TABLE `offers` (
  `id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `helper_id` int(11) NOT NULL,
  `offered_price` decimal(15,2) NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','accepted','declined','expired') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `offers`
--

INSERT INTO `offers` (`id`, `job_id`, `helper_id`, `offered_price`, `message`, `status`, `created_at`, `updated_at`) VALUES
(1, 471, 29, 50000.00, 'pesankan sekarang cik', 'pending', '2026-06-28 10:11:29', '2026-06-28 10:11:29'),
(5, 486, 29, 45000.00, 'Bisa kan?', 'accepted', '2026-07-04 19:54:26', '2026-07-04 19:55:59'),
(6, 486, 8, 70000.00, 'Bisa?', 'declined', '2026-07-04 19:54:51', '2026-07-04 19:55:25'),
(7, 488, 29, 30000.00, 'Gimana?', 'accepted', '2026-07-04 20:03:34', '2026-07-04 20:03:44');

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `job_id` int(11) NOT NULL,
  `rater_id` int(11) NOT NULL,
  `target_id` int(11) NOT NULL,
  `rater_role` enum('requester','helper') NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` between 1 and 5),
  `ulasan` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ratings`
--

INSERT INTO `ratings` (`id`, `job_id`, `rater_id`, `target_id`, `rater_role`, `rating`, `ulasan`, `created_at`) VALUES
(15, 469, 44, 29, 'requester', 3, '', '2026-06-24 07:06:14'),
(16, 470, 44, 29, 'requester', 5, 'bagusss', '2026-06-24 12:27:19'),
(17, 472, 44, 29, 'requester', 5, 'Bagusss', '2026-06-28 11:29:17'),
(18, 473, 44, 29, 'requester', 5, 'bagussss\r\ntapi belum', '2026-06-28 11:54:16'),
(19, 486, 44, 29, 'requester', 5, 'bagusss', '2026-07-04 19:57:33');

-- --------------------------------------------------------

--
-- Table structure for table `topup_requests`
--

CREATE TABLE `topup_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `nominal` int(11) NOT NULL,
  `admin_fee` int(11) DEFAULT 2500,
  `total_dibayar` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `reject_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `processed_at` datetime DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT 'qris'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `topup_requests`
--

INSERT INTO `topup_requests` (`id`, `user_id`, `nominal`, `admin_fee`, `total_dibayar`, `status`, `approved_by`, `reject_reason`, `created_at`, `processed_at`, `payment_method`) VALUES
(56, 45, 10000, 2500, 12500, 'rejected', NULL, 'gabayar', '2026-06-25 05:09:44', '2026-06-26 13:00:30', 'qris');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` varchar(20) DEFAULT 'requester',
  `target_user_id` int(11) DEFAULT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `type` enum('topup','fee','payment','withdrawal','komisi','service_fee','admin_fee','emergency_fee','helper_fee','debit','tip') NOT NULL DEFAULT 'topup',
  `status` enum('pending','success','failed') DEFAULT 'success',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `role`, `target_user_id`, `reference_id`, `reference_type`, `amount`, `description`, `type`, `status`, `created_at`) VALUES
(794, 44, 'requester', NULL, 469, 'job', -100000.00, 'Pembayaran pekerjaan: Perbaikan AC Rumah - Job #1', '', 'success', '2026-06-24 07:04:38'),
(795, 44, 'requester', NULL, 469, 'job', -2500.00, 'Biaya admin posting pekerjaan: Perbaikan AC Rumah - Job #1', 'fee', 'success', '2026-06-24 07:04:38'),
(796, 44, 'requester', NULL, 469, 'job', -5000.00, 'Biaya komisi 5% dari pekerjaan: Perbaikan AC Rumah - Job #1 (Rp 5.000)', 'komisi', 'success', '2026-06-24 07:04:38'),
(797, 29, 'helper', NULL, 469, 'job', 95000.00, 'Pembayaran dari pekerjaan: Perbaikan AC Rumah - Job #1 (telah dipotong 5% biaya platform)', 'payment', 'success', '2026-06-24 07:06:09'),
(798, 29, 'helper', NULL, 469, 'job', -5000.00, 'Potongan 5% biaya platform dari pekerjaan: Perbaikan AC Rumah - Job #1', 'komisi', 'success', '2026-06-24 07:06:09'),
(799, 44, 'requester', NULL, 470, 'job', -150000.00, 'Pembayaran pekerjaan: Pindahan Rumah - Job #2', '', 'success', '2026-06-24 07:06:19'),
(800, 44, 'requester', NULL, 470, 'tip', -10000.00, 'Tip untuk pekerjaan: Pindahan Rumah - Job #2', '', 'success', '2026-06-24 07:06:19'),
(801, 44, 'requester', NULL, 470, 'job', -2500.00, 'Biaya admin posting pekerjaan: Pindahan Rumah - Job #2', 'fee', 'success', '2026-06-24 07:06:19'),
(802, 44, 'requester', NULL, 470, 'job', -7500.00, 'Biaya komisi 5% dari pekerjaan: Pindahan Rumah - Job #2 (Rp 7.500)', 'komisi', 'success', '2026-06-24 07:06:19'),
(803, 44, 'requester', NULL, 471, 'job', -75000.00, 'Pembayaran pekerjaan: Servis AC Darurat - Job #3 ????', '', 'success', '2026-06-24 07:06:52'),
(804, 44, 'requester', NULL, 471, 'job', -2500.00, 'Biaya admin posting pekerjaan: Servis AC Darurat - Job #3 ????', 'fee', 'success', '2026-06-24 07:06:52'),
(805, 44, 'requester', NULL, 471, 'job', -3750.00, 'Biaya komisi 5% dari pekerjaan: Servis AC Darurat - Job #3 ???? (Rp 3.750)', 'komisi', 'success', '2026-06-24 07:06:52'),
(806, 29, 'helper', NULL, 470, 'job', 142500.00, 'Pembayaran dari pekerjaan: Pindahan Rumah - Job #2 (telah dipotong 5% biaya platform)', 'payment', 'success', '2026-06-25 12:27:10'),
(807, 29, 'helper', NULL, 470, 'job', -7500.00, 'Potongan 5% biaya platform dari pekerjaan: Pindahan Rumah - Job #2', 'komisi', 'success', '2026-06-25 12:27:10'),
(808, 29, 'helper', NULL, 470, 'tip', 10000.00, 'Tip dari pekerjaan: Pindahan Rumah - Job #2', '', 'success', '2026-06-25 12:27:10'),
(850, 44, 'requester', NULL, 486, 'job', -45000.00, 'Pembayaran deal pekerjaan: Perbaikan nehi nehi', 'debit', 'success', '2026-07-04 19:56:04'),
(851, 44, 'requester', NULL, 486, 'job', -2250.00, 'Service fee 5% dari pekerjaan: Perbaikan nehi nehi', 'service_fee', 'success', '2026-07-04 19:56:04'),
(852, 44, 'requester', NULL, 486, 'job', -2500.00, 'Admin fee pekerjaan: Perbaikan nehi nehi', 'admin_fee', 'success', '2026-07-04 19:56:04'),
(853, 29, 'helper', NULL, 486, 'job', 42750.00, 'Pembayaran dari pekerjaan: Perbaikan nehi nehi (setelah potongan 5%)', 'payment', 'success', '2026-07-04 19:57:26'),
(854, 29, 'helper', NULL, 486, 'job', -2250.00, 'Potongan 5% biaya platform dari pekerjaan: Perbaikan nehi nehi', 'helper_fee', 'success', '2026-07-04 19:57:26'),
(855, 44, 'requester', NULL, 488, 'job', -30000.00, 'Pembayaran deal pekerjaan: aksnclaks', 'debit', 'success', '2026-07-04 20:03:50'),
(856, 44, 'requester', NULL, 488, 'job', -1500.00, 'Service fee 5% dari pekerjaan: aksnclaks', 'service_fee', 'success', '2026-07-04 20:03:50'),
(857, 44, 'requester', NULL, 488, 'job', -2500.00, 'Admin fee pekerjaan: aksnclaks', 'admin_fee', 'success', '2026-07-04 20:03:50');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL,
  `nama_lengkap` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `no_telepon` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `ktp_file` varchar(255) DEFAULT NULL,
  `wallet_balance` decimal(15,2) DEFAULT 0.00,
  `wallet_requester` decimal(15,2) DEFAULT 0.00,
  `wallet_helper` decimal(15,2) DEFAULT 0.00,
  `is_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `rating` decimal(3,1) DEFAULT 0.0,
  `onesignal_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role`, `verification_status`, `rejection_reason`, `verified_at`, `verified_by`, `nama_lengkap`, `email`, `no_telepon`, `password`, `ktp_file`, `wallet_balance`, `wallet_requester`, `wallet_helper`, `is_verified`, `created_at`, `updated_at`, `rating`, `onesignal_id`) VALUES
(6, 'user', 'verified', NULL, '2026-06-15 00:25:14', 40, 'ana', 'anita.aulya2663@student.unri.ac.id', '081276457098', '$2y$10$YYmaZHIHzeY6zykGKaxzHuDWr12yoiKbXm/SJTubFRg19f6Tisl9a', 'uploads/ktp/1773327773_69b2d59dd86d4.png', 0.00, 57500.00, 64700.00, 0, '2026-03-12 15:02:53', '2026-06-15 00:25:14', 0.0, NULL),
(8, 'user', 'verified', NULL, '2026-06-15 00:04:59', 40, 'Fuad Fadhillah', 'fuadfadhillah00@gmail.com', '082286338434', '$2y$10$sXQO.iwloKlUxJR/NrpMhO9/KxluYmMlR2q3mrA3i31.5n5rhugWa', 'uploads/ktp/1773594381_69b6e70df0c78.jpg', 0.00, 9997924219.00, 2223120.00, 0, '2026-03-15 17:06:21', '2026-06-23 22:18:06', 3.5, NULL),
(11, 'user', 'verified', NULL, '2026-06-16 20:49:22', 40, 'Aminah Mukarromah', 'aminahmukarromah01@gmail.com', '083121990555', '$2y$10$2wJ500Mpspk0YXsSGmBvoeRz1Kv4XNeAYhSAV2jYhht107KAVfoJS', NULL, 0.00, 0.00, 0.00, 0, '2026-03-29 12:26:59', '2026-06-16 20:49:22', 0.0, NULL),
(15, 'user', 'verified', NULL, '2026-06-23 22:33:55', 40, 'Rifki Arohman', 'rifkiarohman7@gmail.com', '083180253832', '$2y$10$XGRLv./8HWbZIa1P2qebXOSHGI/TP3eXNjAetNT5sSiJ0V5tjVp7C', NULL, 0.00, 0.00, 0.00, 0, '2026-03-30 06:54:15', '2026-06-23 22:33:55', 0.0, NULL),
(16, 'user', 'verified', NULL, '2026-06-23 22:33:57', 40, 'Rifki Arohman', 'rifkiarohman@gmail.com', '085762043488', '$2y$10$kO5TlqwYwKVmje62/TnTcuxii4lNgp3tWVaa0iBbBfBdb7Vhzg5U6', NULL, 0.00, 0.00, 0.00, 0, '2026-03-30 08:04:13', '2026-06-23 22:33:57', 0.0, NULL),
(21, 'user', 'verified', NULL, '2026-06-23 22:34:01', 40, 'Jamaluddin Salim', 'jamaluddinsalim@gmail.com', '0808000080808', '$2y$10$k5lex2NkLp8e9bkma0A/jOBrD6SV4ueO4TAzxS3KpN470PQiqU7u6', 'uploads/ktp/1775872977_69d9abd12fe9e.jpg', 0.00, 4285720.00, 0.00, 0, '2026-04-11 02:02:57', '2026-06-23 22:34:01', 0.0, NULL),
(22, 'user', 'verified', NULL, '2026-06-23 22:33:48', 40, 'Syafril Azwar', 'syafrilazwar@gmail.com', '0984109840124', '$2y$10$99o9UqjexftvW8zGituq0eNx6kaJ/D4Og7m../VusiBkh.zXrXpgu', 'uploads/ktp/1775882265_69d9d01907ca6.jpg', 0.00, 39377749.00, 0.00, 0, '2026-04-11 04:37:45', '2026-06-23 22:33:48', 0.0, NULL),
(23, 'user', 'verified', NULL, '2026-06-23 22:33:52', 40, 'Nurjainah', 'nurjainah@gmail.com', '2390850923', '$2y$10$IemJxwViLWTFldAqci269eCJBNn1Xl6z2W.rv1hgDcrBuj9ycau4C', 'uploads/ktp/1775883148_69d9d38c63b68.jpg', 0.00, 8496461327.00, 0.00, 0, '2026-04-11 04:52:28', '2026-06-23 22:33:52', 0.0, NULL),
(24, 'user', 'verified', NULL, '2026-06-15 00:25:09', 40, 'nana', 'anitaaulya@gmail.com', '089513513652', '$2y$10$BNr/HqO9ix9tKhNWbGP0zePALzRkM7e2w4AcMNJDnQQjglIjWKU5m', 'uploads/ktp/1779625787_6a12ef3b1777f.png', 0.00, 960.00, 0.00, 0, '2026-05-24 12:29:47', '2026-06-23 21:52:37', 0.0, NULL),
(25, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'Riska Febrianda', 'riskafebrianda05@gmail.com', '083187027259', '$2y$10$WSxVWBx48soYLuYn9qX3eu/UCy2MRs6vpOOQxftt7X8ymXuI0ji/6', 'uploads/ktp/1779685198_6a13d74ec6f73.png', 0.00, 0.00, 0.00, 0, '2026-05-25 04:59:58', '2026-06-24 00:00:00', 0.0, NULL),
(26, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'syakira rahmita istifani', 'syakirarahmitaistifani@gmail.com', '083185424150', '$2y$10$LrMzvRqOXJsHsm.A3EuTrukaYbTmtgpjqg0YFNzJCz0DaCEBIhsfW', NULL, 0.00, 0.00, 0.00, 0, '2026-05-25 05:45:54', '2026-06-24 00:00:00', 0.0, NULL),
(29, 'user', 'verified', NULL, '2026-06-16 13:47:53', 40, 'helper ganteng', 'helper@gmail.com', '081234567890', '$2y$10$79ZbJSAPX00j/FBfuXqX9eApnbkMX1x0y48bNb18x./aNLxVbnpoe', 'uploads/ktp/1781255071_6a2bcb9f55b58.jpeg', 0.00, 3295699.00, 1206870.00, 0, '2026-06-12 09:04:31', '2026-07-04 20:25:16', 4.6, NULL),
(30, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'Livia Septiani Rioza', 'liviarioza3@gmail.com', '085185472086', '$2y$10$qU4jK0c4wFvdupBKQ5K.Me22R86zcxq.AsDjZtM5EOb5QWdoH3VdC', 'uploads/ktp/1779688122_6a13e2ba3e0a7.jpg', 0.00, 0.00, 0.00, 0, '2026-05-25 05:48:42', '2026-06-24 00:00:00', 0.0, NULL),
(31, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'Amelia Hasri', 'amelpku11@gmail.com', '081378753790', '$2y$10$jRp4fgF.bdWybibfebZEV.JP0b6PEVgYH5Fh1IGZXtPHv0c7xTZxC', 'uploads/ktp/1779689969_6a13e9f1c8cdc.jpg', 0.00, 0.00, 0.00, 0, '2026-05-25 06:19:29', '2026-06-24 00:00:00', 0.0, NULL),
(32, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'Windia ismayuni', 'windia.ismayuni123@gmail.com', '085147096767', '$2y$10$RoSAIGSJQ0PEg9tBKXvNT.WIpN2KKXWva9JcFlgQfY4Cqpjkljk26', 'uploads/ktp/1779690716_6a13ecdce8849.pdf', 0.00, 0.00, 0.00, 0, '2026-05-25 06:31:56', '2026-06-24 00:00:00', 0.0, NULL),
(33, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'YABES NATHAN TOBIAS SIREGAR', 'yabesnathan2004@gmail.com', '085371744672', '$2y$10$vroDz22L.D39Q6aOgoCVfOg/Jg4TEVHbgr8W3O3VarURoiyDxUZye', 'uploads/ktp/1779692577_6a13f42150811.jpg', 0.00, 0.00, 0.00, 0, '2026-05-25 07:02:57', '2026-06-24 00:00:00', 0.0, NULL),
(34, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'Nadira Shakila', 'nadirashakila45@gmail.com', '081268821824', '$2y$10$5vzArPxfynM2pZi73jpMp.WKsp8ELiPavSVttDCjP6XPAQEm1WG8S', 'uploads/ktp/1779692695_6a13f497ba75a.jpg', 0.00, 0.00, 0.00, 0, '2026-05-25 07:04:55', '2026-06-24 00:00:00', 0.0, NULL),
(35, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'Karel Tsalasatir Riyan', 'karelriyan@gmail.com', '08978535411', '$2y$10$fBPmGiz/lgN4lyFHyAe9HuyqsXLIouLaBmC9StHox9Yx4MYaYAn.2', 'uploads/ktp/1780111914_6a1a5a2a8cf21.jpeg', 0.00, 9999999999999.99, 0.00, 0, '2026-05-30 03:31:54', '2026-06-24 00:00:00', 0.0, NULL),
(36, 'user', 'verified', NULL, '2026-06-24 00:00:00', 40, 'Septiani Rahayu', 'rahayuseptiani919@gmail.com', '089507367385', '$2y$10$uoQqvZoeotsEWsuIhROQBuElkuDJBpAAF56Qgi9n80rn275ju5Pke', 'uploads/ktp/1780159778_6a1b152288c80.pdf', 0.00, 0.00, 0.00, 0, '2026-05-30 16:49:38', '2026-06-24 00:00:00', 0.0, NULL),
(40, 'admin', 'pending', NULL, NULL, NULL, 'Administrator', 'admin@hendimen.com', '08123456789', '$2y$10$jCKO6f/TZpxco5vBolICVO4pGHP1vl0ifArG4KJUoSZGx2HP3zkOu', 'uploads/ktp/1781406756_6a2e1c245cd31.png', 0.00, 0.00, 0.00, 0, '2026-06-14 03:12:36', '2026-06-14 03:14:25', 0.0, NULL),
(41, 'user', 'verified', NULL, '2026-06-16 20:48:39', 40, 'letta', 'lettaa313@gmail.com', '082199611235', '$2y$10$Kpr0YOWLiXDuf2vnGQ5BiuMQr3ITBDBDBeFR4Gi8hwjwVHomzCseW', NULL, 0.00, 10000.00, 0.00, 0, '2026-06-14 06:48:08', '2026-06-16 20:48:39', 0.0, NULL),
(42, 'user', 'verified', NULL, '2026-06-16 20:48:43', 40, 'Saputra Gane', 'saputraagaane77@gmail.com', '081246578398', '$2y$10$yGVWk6Ch1c.iqCCGGSM/4uTZVHULQJpjAbHVexvU3BYoBELVLXrLq', 'uploads/ktp/1781641172_6a31afd481fff.jpg', 0.00, 0.00, 0.00, 0, '2026-06-16 20:19:32', '2026-06-16 20:48:43', 0.0, NULL),
(43, 'user', 'verified', NULL, NULL, NULL, 'gusaha', 'gusaha@gmail.com', '12312124124', '$2y$10$g5Z2R3k.pwFEh6nF79UPhOzwFY5.e5MwBQ53fhzYiy/gdUGRQ.xHe', 'uploads/ktp/1781669350_6a321de6a85ca.jpeg', 0.00, 0.00, 0.00, 0, '2026-06-17 04:09:10', '2026-06-17 04:09:10', 0.0, NULL),
(44, 'user', 'verified', NULL, NULL, NULL, 'requester ganteng', 'requester@gmail.com', '192401247091274', '$2y$10$a2DiIotfwGgmW3upvxps1.rjQicDOdGRwsHTDeB9HUmD9lh5VRSc.', NULL, 0.00, 426000.00, 0.00, 0, '2026-06-23 21:51:02', '2026-07-04 21:43:19', 0.0, NULL),
(45, 'user', 'verified', NULL, NULL, NULL, 'Dwipa Amedihardjo', 'dwipahyaki@gmail.com', '089504166115', '$2y$10$rs4WRrtRWmTc0UGqfNgQ2.ehB4fenS3Ka719sJ1ZsDokZfaFqdd6u', NULL, 0.00, 0.00, 0.00, 0, '2026-06-25 02:51:57', '2026-06-25 02:51:57', 0.0, NULL),
(46, 'user', 'verified', NULL, NULL, NULL, 'SHALMA QAULAN FADILLA', 'shalma.qaulan0350@student.unri.ac.id', '081995826780', '$2y$10$86lgx6Avz4Xvs.OeAmz3Peh.9R6FgwQm/.yoLSqcfRYK.U1470vja', 'uploads/ktp/1783176951_6a491ef7db3da.jpg', 0.00, 0.00, 0.00, 0, '2026-07-04 14:55:51', '2026-07-04 14:55:51', 0.0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `verification_requests`
--

CREATE TABLE `verification_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ktp_file` varchar(255) NOT NULL,
  `ktp_original_name` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `withdraw_requests`
--

CREATE TABLE `withdraw_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  `admin_fee` decimal(15,2) DEFAULT 2500.00,
  `bank` varchar(50) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `account_name` varchar(100) NOT NULL,
  `status` enum('pending','completed','rejected') DEFAULT 'pending',
  `admin_note` text DEFAULT NULL,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conversation` (`job_id`,`helper_id`,`requester_id`),
  ADD KEY `helper_id` (`helper_id`),
  ADD KEY `requester_id` (`requester_id`),
  ADD KEY `idx_last_time` (`last_message_time`),
  ADD KEY `idx_helper_requester` (`helper_id`,`requester_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_job` (`job_id`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_receiver` (`receiver_id`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_read` (`is_read`),
  ADD KEY `idx_job_sender_receiver` (`job_id`,`sender_id`,`receiver_id`),
  ADD KEY `idx_job_receiver_read` (`job_id`,`receiver_id`,`is_read`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_favorite` (`user_id`,`job_id`),
  ADD KEY `job_id` (`job_id`);

--
-- Indexes for table `fcm_tokens`
--
ALTER TABLE `fcm_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_token` (`token`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `helper_id` (`helper_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_status_created` (`status`,`created_at`),
  ADD KEY `idx_user_status` (`user_id`,`status`);

--
-- Indexes for table `job_reports`
--
ALTER TABLE `job_reports`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_read` (`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `offers`
--
ALTER TABLE `offers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_offer` (`job_id`,`helper_id`),
  ADD KEY `idx_job` (`job_id`),
  ADD KEY `idx_helper` (`helper_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_job_status` (`job_id`,`status`),
  ADD KEY `idx_helper_status` (`helper_id`,`status`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_job_id` (`job_id`),
  ADD KEY `idx_rater_id` (`rater_id`),
  ADD KEY `idx_target_id` (`target_id`);

--
-- Indexes for table `topup_requests`
--
ALTER TABLE `topup_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_user_role` (`user_id`,`role`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `no_telepon` (`no_telepon`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_phone` (`no_telepon`);

--
-- Indexes for table `verification_requests`
--
ALTER TABLE `verification_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `withdraw_requests`
--
ALTER TABLE `withdraw_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=182;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=95;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `fcm_tokens`
--
ALTER TABLE `fcm_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=489;

--
-- AUTO_INCREMENT for table `job_reports`
--
ALTER TABLE `job_reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3651;

--
-- AUTO_INCREMENT for table `offers`
--
ALTER TABLE `offers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `ratings`
--
ALTER TABLE `ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `topup_requests`
--
ALTER TABLE `topup_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=858;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `verification_requests`
--
ALTER TABLE `verification_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `withdraw_requests`
--
ALTER TABLE `withdraw_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `chat_conversations_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_conversations_ibfk_2` FOREIGN KEY (`helper_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_conversations_ibfk_3` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `jobs`
--
ALTER TABLE `jobs`
  ADD CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `jobs_ibfk_2` FOREIGN KEY (`helper_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `offers`
--
ALTER TABLE `offers`
  ADD CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `offers_ibfk_2` FOREIGN KEY (`helper_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `topup_requests`
--
ALTER TABLE `topup_requests`
  ADD CONSTRAINT `topup_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `verification_requests`
--
ALTER TABLE `verification_requests`
  ADD CONSTRAINT `verification_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `withdraw_requests`
--
ALTER TABLE `withdraw_requests`
  ADD CONSTRAINT `withdraw_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
