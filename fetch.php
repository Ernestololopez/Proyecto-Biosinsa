<?php
// fetch.php
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

try {
    $pdo = getPDO();
    $stmt = $pdo->query('SELECT nombre, correo FROM usuarios ORDER BY creado_at DESC');
    $rows = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $rows]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al obtener datos: ' . $e->getMessage()]);
}
