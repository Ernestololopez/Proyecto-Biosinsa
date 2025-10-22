<?php
// insert.php
header('Content-Type: application/json; charset=utf-8');

// leer JSON entrante
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'JSON inválido.']);
    exit;
}

$nombre = trim($data['nombre'] ?? '');
$edad = $data['edad'] ?? null;
$sexo = $data['sexo'] ?? '';
$fecha_nacimiento = $data['fecha_nacimiento'] ?? '';
$correo = trim($data['correo'] ?? '');

// Validaciones básicas
if ($nombre === '' || $edad === null || $sexo === '' || $fecha_nacimiento === '' || $correo === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios.']);
    exit;
}

// validar edad numérica y rango 18-60
$edad = (int)$edad;
if ($edad < 18 || $edad > 60) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'La edad debe estar entre 18 y 60 años.']);
    exit;
}

// validar formato de correo
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Correo inválido.']);
    exit;
}

// validar fecha
$date = DateTime::createFromFormat('Y-m-d', $fecha_nacimiento);
if (!$date || $date->format('Y-m-d') !== $fecha_nacimiento) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Fecha de nacimiento inválida.']);
    exit;
}

// opcional: recalcular edad desde fecha para consistencia
$today = new DateTime();
$diff = $today->diff($date);
$calculatedAge = (int)$diff->y;
if ($calculatedAge !== $edad) {
    // no fallamos, solo sincronizamos a la edad calculada y verificamos rango
    $edad = $calculatedAge;
}
if ($edad < 18 || $edad > 60) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'La edad calculada desde la fecha no está entre 18 y 60.']);
    exit;
}

// insertar en DB
require_once 'db.php';

try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('INSERT INTO usuarios (nombre, edad, sexo, fecha_nacimiento, correo) VALUES (:nombre, :edad, :sexo, :fecha_nacimiento, :correo)');
    $stmt->execute([
        ':nombre' => $nombre,
        ':edad' => $edad,
        ':sexo' => $sexo,
        ':fecha_nacimiento' => $fecha_nacimiento,
        ':correo' => $correo,
    ]);
    echo json_encode(['success' => true, 'message' => 'Registro guardado correctamente.']);
} catch (PDOException $e) {
    // si correo duplicado
    if ($e->errorInfo[1] == 1062) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'El correo ya existe.']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al insertar: ' . $e->getMessage()]);
    }
}
