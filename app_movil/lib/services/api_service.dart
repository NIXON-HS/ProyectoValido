import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  // Apuntando a la API en Render (Balanceador NGINX - cambiar cuando esté listo)
  // Instancias disponibles:
  //   https://api-rest-render-1.onrender.com
  //   https://api-rest-render-2.onrender.com
  static const String baseUrl = 'https://api-rest-render-1.onrender.com';

  static Future<Map<String, String>> _getHeaders() async {
    final user = FirebaseAuth.instance.currentUser;
    String token = '';
    if (user != null) {
      token = await user.getIdToken() ?? '';
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  static Future<List<dynamic>> getProducts() async {
    final response = await http.get(Uri.parse('$baseUrl/productos'));
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al cargar productos');
  }

  static Future<List<dynamic>> getPurchases(String userId) async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/compras/$userId'),
      headers: headers,
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al cargar historial de compras');
  }

  static Future<void> buyProduct(int productId, double total, String email) async {
    final headers = await _getHeaders();
    final user = FirebaseAuth.instance.currentUser;
    
    final response = await http.post(
      Uri.parse('$baseUrl/compras'),
      headers: headers,
      body: jsonEncode({
        'usuario_id': user?.uid,
        'producto_id': productId,
        'cantidad': 1,
        'total': total,
        'email_cliente': email,
      }),
    );
    if (response.statusCode != 201) {
      throw Exception('Error al procesar la compra: ${response.body}');
    }
  }

  static Future<void> syncUser(User user, String name) async {
    final headers = await _getHeaders();
    await http.post(
      Uri.parse('$baseUrl/usuarios'),
      headers: headers,
      body: jsonEncode({
        'id': user.uid,
        'nombre': name,
        'email': user.email,
        'rol': 'cliente',
      }),
    );
  }
}
