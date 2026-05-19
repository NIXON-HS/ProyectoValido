import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/api_service.dart';

class PurchasesScreen extends StatefulWidget {
  @override
  _PurchasesScreenState createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  List<dynamic> purchases = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadPurchases();
  }

  Future<void> loadPurchases() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final data = await ApiService.getPurchases(user.uid);
        setState(() {
          purchases = data;
          loading = false;
        });
      }
    } catch (e) {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[900],
      appBar: AppBar(
        title: Text('Mis Compras'),
        backgroundColor: Colors.grey[850],
      ),
      body: loading 
          ? Center(child: CircularProgressIndicator())
          : purchases.isEmpty
              ? Center(child: Text('No tienes compras aún', style: TextStyle(color: Colors.white54)))
              : ListView.builder(
                  padding: EdgeInsets.all(12),
                  itemCount: purchases.length,
                  itemBuilder: (context, index) {
                    final p = purchases[index];
                    final isValidada = p['estado_factura'] == 'VALIDADA';
                    return Card(
                      color: Colors.grey[800],
                      margin: EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        title: Text('Producto: ${p['productos']?['nombre'] ?? 'N/A'}', style: TextStyle(color: Colors.white)),
                        subtitle: Text('Total: \$${p['total']}\nFecha: ${p['fecha'].substring(0, 10)}', style: TextStyle(color: Colors.white70)),
                        trailing: Chip(
                          label: Text(p['estado_factura']),
                          backgroundColor: isValidada ? Colors.green.withOpacity(0.2) : Colors.orange.withOpacity(0.2),
                          labelStyle: TextStyle(color: isValidada ? Colors.greenAccent : Colors.orangeAccent),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
