<?php
$url = "https://api.jolpi.ca/ergast/f1/drivers/hamilton/driverStandings.json?limit=5&offset=0";
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 12,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT      => 'F1Analytics/1.0',
    CURLOPT_HTTPHEADER     => ['Accept: application/json'],
]);
$body = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err  = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $code\n";
echo "Curl error: $err\n";
echo "Response: " . substr($body, 0, 500);