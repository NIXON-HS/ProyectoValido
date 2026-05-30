class CartItemData {
  CartItemData({required this.product, required this.quantity});

  final dynamic product;
  int quantity;

  String get key => product['id'].toString();

  String get name => product['nombre']?.toString() ?? 'Producto';

  String get description => product['descripcion']?.toString() ?? '';

  double get unitPrice => double.tryParse(product['precio'].toString()) ?? 0;

  int get stock => int.tryParse(product['stock']?.toString() ?? '0') ?? 0;

  int get availableStock => stock - quantity;

  double get subtotal => unitPrice * quantity;
}

class CartScreenResult {
  const CartScreenResult({
    required this.items,
    required this.purchased,
    this.purchasedCount = 0,
  });

  final List<CartItemData> items;
  final bool purchased;
  final int purchasedCount;
}
