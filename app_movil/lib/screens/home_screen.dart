import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/api_service.dart';
import 'purchases_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> products = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadProducts();
  }

  Future<void> loadProducts() async {
    try {
      final data = await ApiService.getProducts();
      setState(() {
        products = data;
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
    }
  }

  void handleBuy(dynamic product) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    
    showDialog(
      context: context,
      builder: (c) => AlertDialog(
        backgroundColor: Colors.grey[850],
        title: Text('Confirmar compra', style: TextStyle(color: Colors.white)),
        content: Text('¿Comprar ${product['nombre']} por \$${product['precio']}?', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: Text('Cancelar')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(c);
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Procesando compra y contactando SOAP...')));
              try {
                await ApiService.buyProduct(product['id'], double.parse(product['precio'].toString()), user.email!);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('¡Compra exitosa! Revisa tu historial.'), backgroundColor: Colors.green));
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
              }
            },
            child: Text('Comprar'),
          )
        ],
      )
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[900],
      appBar: AppBar(
        title: Text('Catálogo Móvil'),
        backgroundColor: Colors.grey[850],
        actions: [
          IconButton(
            icon: Icon(Icons.receipt_long),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PurchasesScreen())),
          ),
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => LoginScreen()));
            },
          )
        ],
      ),
      body: loading 
          ? Center(child: CircularProgressIndicator()) 
          : ListView.builder(
              padding: EdgeInsets.all(12),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final p = products[index];
                return Card(
                  color: Colors.grey[800],
                  margin: EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: EdgeInsets.all(16),
                    leading: CircleAvatar(
                      backgroundColor: Colors.blueAccent.withOpacity(0.2),
                      child: Icon(Icons.shopping_bag, color: Colors.blueAccent),
                    ),
                    title: Text(p['nombre'], style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                    subtitle: Text('\$${p['precio']}', style: TextStyle(color: Colors.greenAccent, fontSize: 16)),
                    trailing: ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.blueAccent),
                      onPressed: () => handleBuy(p),
                      child: Text('Comprar', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
