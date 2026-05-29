import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../models/cart_item.dart';
import '../services/api_service.dart';
import '../services/theme_controller.dart';
import '../widgets/theme_fab.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key, required this.initialItems});

  final List<CartItemData> initialItems;

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  late List<CartItemData> _items;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    ThemeController.isDark.addListener(_themeListener);
    _items = widget.initialItems
        .map(
          (item) =>
              CartItemData(product: item.product, quantity: item.quantity),
        )
        .toList();
  }

  void _themeListener() => setState(() {});

  @override
  void dispose() {
    ThemeController.isDark.removeListener(_themeListener);
    super.dispose();
  }

  bool get _isDarkMode => ThemeController.isDark.value;

  Color get _pageStart =>
      _isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFDCEEFF);
  Color get _pageEnd =>
      _isDarkMode ? const Color(0xFF020617) : const Color(0xFFF8FBFF);
  Color get _surface => _isDarkMode ? const Color(0xFF111827) : Colors.white;
  Color get _surfaceSoft => _isDarkMode
      ? Colors.white.withValues(alpha: 0.06)
      : const Color(0xFFF8FBFF);
  Color get _border => _isDarkMode
      ? Colors.white.withValues(alpha: 0.08)
      : const Color(0xFFBFDBFE);
  Color get _textPrimary =>
      _isDarkMode ? Colors.white : const Color(0xFF0F172A);
  Color get _textSecondary => _isDarkMode
      ? Colors.white.withValues(alpha: 0.72)
      : const Color(0xFF475569);

  double get _total => _items.fold(0, (sum, item) => sum + item.subtotal);
  int get _totalUnits => _items.fold(0, (sum, item) => sum + item.quantity);

  bool _hasStockIssue(CartItemData item) =>
      item.stock <= 0 || item.quantity > item.stock;

  Future<void> _askAndBuyAll() async {
    if (_items.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Tu carrito está vacío.')));
      return;
    }

    if (_items.any(_hasStockIssue)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Hay productos sin stock suficiente. Ajusta tu carrito antes de comprar.',
          ),
        ),
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Confirmar compra'),
          content: Text(
            'Vas a comprar $_totalUnits producto(s) por \$${_total.toStringAsFixed(2)}.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Comprar todo'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    setState(() => _processing = true);
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw Exception('Debes iniciar sesión nuevamente.');
      }

      var processed = 0;
      for (final item in _items) {
        final productId = int.tryParse(item.key);
        if (productId == null) continue;
        for (var index = 0; index < item.quantity; index++) {
          await ApiService.buyProduct(
            productId,
            item.unitPrice,
            user.email ?? '',
          );
          processed++;
        }
      }

      if (!mounted) return;
      Navigator.pop(
        context,
        CartScreenResult(
          items: const [],
          purchased: true,
          purchasedCount: processed,
        ),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No se pudo completar la compra: $error')),
        );
      }
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  void _removeItemAt(int index) => setState(() => _items.removeAt(index));

  void _increaseQuantity(int index) {
    final item = _items[index];
    if (item.quantity >= item.stock) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ya no hay más stock disponible para este producto.'),
        ),
      );
      return;
    }
    setState(() => item.quantity += 1);
  }

  void _decreaseQuantity(int index) {
    setState(() {
      if (_items[index].quantity > 1) {
        _items[index].quantity -= 1;
      } else {
        _items.removeAt(index);
      }
    });
  }

  void _clearCart() => setState(() => _items = []);

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        Navigator.pop(
          context,
          CartScreenResult(items: _items, purchased: false),
        );
      },
      child: Scaffold(
        backgroundColor: _pageEnd,
        appBar: AppBar(
          title: const Text('Mi carrito'),
          centerTitle: false,
          backgroundColor: _isDarkMode ? const Color(0xFF0F172A) : Colors.white,
          foregroundColor: _textPrimary,
          actions: [
            if (_items.isNotEmpty)
              IconButton(
                onPressed: _processing ? null : _clearCart,
                icon: const Icon(Icons.delete_outline_rounded),
                tooltip: 'Vaciar carrito',
              ),
          ],
        ),
        body: Stack(
          children: [
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [_pageStart, _pageEnd],
                ),
              ),
              child: SafeArea(
                child: _items.isEmpty
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(18),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _surfaceSoft,
                                  border: Border.all(color: _border),
                                ),
                                child: Icon(
                                  Icons.shopping_cart_outlined,
                                  size: 44,
                                  color: _textPrimary,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Tu carrito está vacío',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                  color: _textPrimary,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Agrega productos desde el catálogo para comprar todo en un solo paso.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: _textSecondary),
                              ),
                            ],
                          ),
                        ),
                      )
                    : Column(
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                            child: Row(
                              children: [
                                Expanded(
                                  child: _HeaderTile(
                                    title: 'Productos en carrito',
                                    value: _items.length.toString(),
                                    icon: Icons.local_mall_outlined,
                                    isDarkMode: _isDarkMode,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _HeaderTile(
                                    title: 'Total',
                                    value: '\$${_total.toStringAsFixed(2)}',
                                    icon: Icons.payments_outlined,
                                    isDarkMode: _isDarkMode,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Expanded(
                            child: ListView.separated(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              itemCount: _items.length,
                              separatorBuilder: (context, index) =>
                                  const SizedBox(height: 12),
                              itemBuilder: (context, index) {
                                final item = _items[index];
                                return _CartCard(
                                  item: item,
                                  isDarkMode: _isDarkMode,
                                  textPrimary: _textPrimary,
                                  textSecondary: _textSecondary,
                                  border: _border,
                                  surface: _surface,
                                  onIncrease: () => _increaseQuantity(index),
                                  onDecrease: () => _decreaseQuantity(index),
                                  onRemove: () => _removeItemAt(index),
                                );
                              },
                            ),
                          ),
                          SafeArea(
                            top: false,
                            child: Container(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                              decoration: BoxDecoration(
                                color: _isDarkMode
                                    ? Colors.black.withValues(alpha: 0.12)
                                    : Colors.white,
                                border: Border(top: BorderSide(color: _border)),
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: _processing
                                          ? null
                                          : _clearCart,
                                      icon: const Icon(
                                        Icons.remove_shopping_cart_outlined,
                                      ),
                                      label: const Text('Vaciar'),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    flex: 2,
                                    child: SizedBox(
                                      height: 56,
                                      child: FilledButton.icon(
                                        onPressed: _processing
                                            ? null
                                            : _askAndBuyAll,
                                        icon: _processing
                                            ? const SizedBox(
                                                width: 18,
                                                height: 18,
                                                child:
                                                    CircularProgressIndicator(
                                                      strokeWidth: 2,
                                                      color: Colors.white,
                                                    ),
                                              )
                                            : const Icon(
                                                Icons
                                                    .shopping_cart_checkout_outlined,
                                              ),
                                        label: Text(
                                          _processing
                                              ? 'Procesando...'
                                              : 'Comprar todo',
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
            const Positioned(right: 16, bottom: 16, child: ThemeFab()),
          ],
        ),
      ),
    );
  }
}

class _HeaderTile extends StatelessWidget {
  const _HeaderTile({
    required this.title,
    required this.value,
    required this.icon,
    required this.isDarkMode,
  });

  final String title;
  final String value;
  final IconData icon;
  final bool isDarkMode;

  @override
  Widget build(BuildContext context) {
    final border = isDarkMode
        ? Colors.white.withValues(alpha: 0.10)
        : const Color(0xFFBFDBFE);
    final textPrimary = isDarkMode ? Colors.white : const Color(0xFF0F172A);
    final textSecondary = isDarkMode
        ? Colors.white.withValues(alpha: 0.70)
        : const Color(0xFF475569);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDarkMode ? Colors.white.withValues(alpha: 0.08) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: const LinearGradient(
                colors: [Color(0xFF38BDF8), Color(0xFF2563EB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Icon(icon, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(color: textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CartCard extends StatelessWidget {
  const _CartCard({
    required this.item,
    required this.isDarkMode,
    required this.textPrimary,
    required this.textSecondary,
    required this.border,
    required this.surface,
    required this.onIncrease,
    required this.onDecrease,
    required this.onRemove,
  });

  final CartItemData item;
  final bool isDarkMode;
  final Color textPrimary;
  final Color textSecondary;
  final Color border;
  final Color surface;
  final VoidCallback onIncrease;
  final VoidCallback onDecrease;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final stockIssue = item.stock <= 0 || item.quantity > item.stock;
    final canIncrease = item.quantity < item.stock && item.stock > 0;

    return Container(
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: border),
        boxShadow: [
          BoxShadow(
            color: (isDarkMode ? Colors.black : Colors.blue).withValues(
              alpha: isDarkMode ? 0.20 : 0.08,
            ),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF60A5FA), Color(0xFF2563EB)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: const Icon(
                    Icons.inventory_2_outlined,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.name,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.description.isEmpty
                            ? 'Producto agregado al carrito'
                            : item.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: textSecondary, height: 1.3),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: onRemove,
                  icon: const Icon(
                    Icons.delete_outline_rounded,
                    color: Colors.redAccent,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Text(
                  '\$${item.unitPrice.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: isDarkMode
                        ? const Color(0xFF7DD3FC)
                        : const Color(0xFF2563EB),
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                _QuantityButton(
                  icon: Icons.remove,
                  onTap: onDecrease,
                  enabled: item.quantity > 1,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Text(
                    item.quantity.toString(),
                    style: TextStyle(
                      color: textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                ),
                _QuantityButton(
                  icon: Icons.add,
                  onTap: onIncrease,
                  enabled: canIncrease,
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  'Stock base: ${item.stock}',
                  style: TextStyle(
                    color: stockIssue ? const Color(0xFFFCA5A5) : textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                Text(
                  'Disponible: ${item.availableStock < 0 ? 0 : item.availableStock}',
                  style: TextStyle(
                    color: stockIssue ? const Color(0xFFFCA5A5) : textSecondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                'Subtotal: \$${item.subtotal.toStringAsFixed(2)}',
                style: TextStyle(
                  color: textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (stockIssue)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  'Sin stock suficiente para seguir incrementando.',
                  style: TextStyle(
                    color: const Color(0xFFFCA5A5),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  const _QuantityButton({
    required this.icon,
    required this.onTap,
    required this.enabled,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: enabled
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.white.withValues(alpha: 0.04),
          border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
        ),
        child: Icon(
          icon,
          size: 18,
          color: enabled ? Colors.white : Colors.white54,
        ),
      ),
    );
  }
}
