<?php
// public/send.php

header('Content-Type: application/json; charset=utf-8');

// ---------------- CONFIG ----------------
$recipient = 'hello@kevinpkoch.com';     
$maxLen    = 2000;

// Rate limit
$burstWindowSeconds = 60;   // 1 minute
$burstMaxRequests   = 2;    // max 2 sends per minute
$hourWindowSeconds  = 3600; // 1 hour
$hourMaxRequests    = 8;    // max 8 sends per hour

// Timing trap (bots submit instantly)
$minHumanTimeMs = 1200;     // 1.2s minimum
$maxHumanTimeMs = 1000 * 60 * 60; // 1 hour max (optional)

// reCAPTCHA (optional)
// If you don't want reCAPTCHA, set this to false.
$useRecaptcha = false;

// v3: You'll send a token via "recaptcha_token" and we verify server-side.
// v2 checkbox also returns a token in "g-recaptcha-response". We support both keys below.
$recaptchaSecret = 'YOUR_RECAPTCHA_SECRET_KEY'; // placeholder
$recaptchaMinScore = 0.5; // for v3 only

// ---------------------------------------

// Only POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

// Basic origin check (soft): if Origin exists, it should match host
if (!empty($_SERVER['HTTP_ORIGIN'])) {
  $originHost = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
  $host = $_SERVER['HTTP_HOST'] ?? '';
  if ($originHost && $host && strcasecmp($originHost, $host) !== 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid origin']);
    exit;
  }
}

// Helper
function clean($v) {
  return trim(strip_tags((string)$v));
}
function json_error($code, $msg) {
  http_response_code($code);
  echo json_encode(['error' => $msg]);
  exit;
}

// Read fields
$name    = clean($_POST['name'] ?? '');
$email   = clean($_POST['email'] ?? '');
$message = trim((string)($_POST['message'] ?? ''));

// Honeypot field (should be empty)
$company = clean($_POST['company'] ?? '');
if ($company !== '') {
  // Bot caught
  json_error(400, 'Submission rejected');
}

// Timing trap
$tookMs = (int)($_POST['took_ms'] ?? 0);
if ($tookMs > 0) {
  if ($tookMs < $minHumanTimeMs) json_error(429, 'Too fast. Please try again.');
  if ($tookMs > $maxHumanTimeMs) json_error(400, 'Invalid submission time.');
}

// Validate required
if ($name === '' || $email === '' || $message === '') {
  json_error(400, 'All fields are required');
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  json_error(400, 'Invalid email address');
}

// Length limit
if (mb_strlen($message, 'UTF-8') > $maxLen) {
  json_error(400, 'Message too long');
}

// Prevent header injection (important!)
$bad = ["\r", "\n", "%0a", "%0d"];
foreach ($bad as $b) {
  if (stripos($email, $b) !== false || stripos($name, $b) !== false) {
    json_error(400, 'Invalid input');
  }
}

// Rate limit (file-based)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
$fingerprint = hash('sha256', $ip . '|' . $ua);

// Store in temp dir
$dir = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'contact_rate_limit';
if (!is_dir($dir)) {
  @mkdir($dir, 0700, true);
}
$file = $dir . DIRECTORY_SEPARATOR . $fingerprint . '.json';

$now = time();
$data = ['timestamps' => []];

if (file_exists($file)) {
  $raw = @file_get_contents($file);
  $decoded = json_decode($raw ?: '', true);
  if (is_array($decoded) && isset($decoded['timestamps']) && is_array($decoded['timestamps'])) {
    $data = $decoded;
  }
}

// Keep only recent timestamps (last hour)
$data['timestamps'] = array_values(array_filter($data['timestamps'], function($ts) use ($now, $hourWindowSeconds) {
  return is_int($ts) && ($now - $ts) <= $hourWindowSeconds;
}));

// Check burst window
$burstCount = 0;
foreach ($data['timestamps'] as $ts) {
  if (($now - $ts) <= $burstWindowSeconds) $burstCount++;
}
if ($burstCount >= $burstMaxRequests) {
  json_error(429, 'Too many messages. Please wait a bit and try again.');
}

// Check hour limit
if (count($data['timestamps']) >= $hourMaxRequests) {
  json_error(429, 'Hourly limit reached. Please try again later.');
}

// reCAPTCHA verification (optional)
if ($useRecaptcha) {
  $token = clean($_POST['recaptcha_token'] ?? '');
  // also support v2 default field name:
  if ($token === '') $token = clean($_POST['g-recaptcha-response'] ?? '');

  if ($token === '') {
    json_error(400, 'reCAPTCHA required');
  }

  $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
  $postData = http_build_query([
    'secret' => $recaptchaSecret,
    'response' => $token,
    'remoteip' => $ip
  ]);

  // Try cURL first, fallback to file_get_contents
  $resp = null;

  if (function_exists('curl_init')) {
    $ch = curl_init($verifyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $resp = curl_exec($ch);
    curl_close($ch);
  } else {
    $context = stream_context_create([
      'http' => [
        'method'  => 'POST',
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'content' => $postData,
        'timeout' => 8
      ]
    ]);
    $resp = @file_get_contents($verifyUrl, false, $context);
  }

  $r = json_decode($resp ?: '', true);
  if (!is_array($r) || empty($r['success'])) {
    json_error(403, 'reCAPTCHA verification failed');
  }

  // If v3, check score if present
  if (isset($r['score']) && is_numeric($r['score'])) {
    if ((float)$r['score'] < $recaptchaMinScore) {
      json_error(403, 'reCAPTCHA score too low');
    }
  }
}

// Add this send attempt to timestamps and persist
$data['timestamps'][] = $now;
@file_put_contents($file, json_encode($data), LOCK_EX);

// Compose email
$subject = "[Contact] {$siteName}";

// Build body
$body = "New message from your portfolio contact form:\n\n";
$body .= "Name: {$name}\n";
$body .= "Email: {$email}\n\n";
$body .= "Message:\n{$message}\n\n";
$body .= "---\n";
$body .= "IP: {$ip}\n";
$body .= "User Agent: {$ua}\n";

// Headers (use Reply-To instead of From with user mail to avoid SPF/DMARC issues)
$host = $_SERVER['SERVER_NAME'] ?? 'example.com';
$from = "no-reply@{$host}";

$headers = [];
$headers[] = "From: {$siteName} <{$from}>";
$headers[] = "Reply-To: {$email}";
$headers[] = "Content-Type: text/plain; charset=UTF-8";

// Send
$ok = @mail($recipient, $subject, $body, implode("\r\n", $headers));

if (!$ok) {
  json_error(500, 'Message could not be sent');
}

echo json_encode(['success' => true]);
