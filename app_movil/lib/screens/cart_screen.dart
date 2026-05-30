import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/cart_item.dart';
import '../services/api_service.dart';
import '../services/theme_controller.dart';
import '../theme/app_theme.dart';

// ── Quantity stepper button ───────────────────────────────────
class _QtyBtn extends StatelessWidget {
  const _QtyBtn({required this.icon, required this.onTap, required this.enabled, required this.isDark});
  final IconData icon;
  final VoidCallback onTap;
  final bool enabled, isDark;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: 36, height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: enabled
              ? (isDark ? AppColors.slate700 : AppColors.slate100)
              : (isDark ? AppColors.slate800 : AppColors.slate50),
          border: Border.all(color: isDark ? AppColors.slate600 : AppColors.slate200),
        ),
        child: Icon(icon, size: 17,
            color: enabled
                ? (isDark ? Colors.white : AppColors.slate700)
                : (isDark ? AppColors.slate600 : AppColors.slate300)),
      ),
    );
  }
}

// ── Cart item card ────────────────────────────────────────────
class _CartCard extends StatelessWidget {
  const _CartCard({
    required this.item, required this.isDark,
    required this.onIncrease, required this.onDecrease, required this.onRemove,
  });
  final CartItemData item;
  final bool isDark;
  final VoidCallback onIncrease, onDecrease, onRemove;

  @override
  Widget build(BuildContext context) {
    final stockIssue  = item.stock <= 0 || item.quantity > item.stock;
    final canIncrease = item.quantity < item.stock && item.stock > 0;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.slate900 : Colors.white,
        borderRadius: AppRadius.xxl,
        border: Border.all(color: isDark ? AppColors.slate800 : AppColors.slate200),
        boxShadow: AppShadows.card(isDark: isDark),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 54, height: 54,
              decoration: const BoxDecoration(gradient: AppGradients.brand, borderRadius: AppRadius.lg),
              child: const Icon(Icons.inventory_2_outlined, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.name, style: GoogleFonts.inter(
                  fontSize: 15, fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppColors.slate900)),
              const SizedBox(height: 3),
              Text(item.description.isEmpty ? 'Producto añadido al carrito' : item.description,
                  maxLines: 2, overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontSize: 13, height: 1.3,
                      color: isDark ? AppColors.slate400 : AppColors.slate500)),
            ])),
            IconButton(
              onPressed: onRemove,
              icon: const Icon(Icons.delete_outline_rounded, size: 20),
              color: isDark ? AppColors.red400 : AppColors.red500,
              style: IconButton.styleFrom(
                backgroundColor: AppColors.red500.withValues(alpha: 0.10),
                padding: const EdgeInsets.all(6),
                minimumSize: const Size(34, 34),
              ),
            ),
          ]),

          const SizedBox(height: 14),

          Row(children: [
            Text('\$${item.unitPrice.toStringAsFixed(2)}',
                style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900,
                    color: isDark ? AppColors.blue400 : AppColors.blue600)),
            const Spacer(),
            _QtyBtn(icon: Icons.remove_rounded, onTap: onDecrease, enabled: item.quantity > 1, isDark: isDark),
            SizedBox(width: 40, child: Center(child:
                Text(item.quantity.toString(), style: GoogleFonts.inter(
                    fontWeight: FontWeight.w800, fontSize: 16,
                    color: isDark ? Colors.white : AppColors.slate900)))),
            _QtyBtn(icon: Icons.add_rounded, onTap: onIncrease, enabled: canIncrease, isDark: isDark),
          ]),

          const SizedBox(height: 10),

          Row(children: [
            Text('Stock: ${item.stock}',
                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600,
                    color: stockIssue ? AppColors.red400 : (isDark ? AppColors.slate400 : AppColors.slate500))),
            const Spacer(),
            Text('Subtotal: \$${item.subtotal.toStringAsFixed(2)}',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700,
                    color: isDark ? AppColors.slate300 : AppColors.slate600)),
          ]),

          if (stockIssue)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.red500.withValues(alpha: 0.10),
                  borderRadius: AppRadius.full,
                  border: Border.all(color: AppColors.red500.withValues(alpha: 0.25)),
                ),
                child: Text('⚠ Stock insuficiente',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.red400)),
              ),
            ),
        ]),
      ),
    );
  }
}

// ── Summary tile ──────────────────────────────────────────────
class _SummaryTile extends StatelessWidget {
  const _SummaryTile({required this.icon, required this.label, required this.value, required this.isDark});
  final IconData icon;
  final String label, value;
  final bool isDark;
  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.slate900 : Colors.white,
          borderRadius: AppRadius.xl,
          border: Border.all(color: isDark ? AppColors.slate800 : AppColors.slate200),
          boxShadow: AppShadows.card(isDark: isDark),
        ),
        child: Row(children: [
          Container(width: 40, height: 40,
            decoration: const BoxDecoration(gradient: AppGradients.brand, borderRadius: AppRadius.md),
            child: Icon(icon, color: Colors.white, size: 20)),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: GoogleFonts.inter(fontSize: 11,
                color: isDark ? AppColors.slate400 : AppColors.slate500)),
            Text(value, overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.slate900)),
          ])),
        ]),
      ),
    );
  }
}

// ── CartScreen ────────────────────────────────────────────────
class CartScreen extends StatefulWidget {
  const CartScreen({super.key, required this.initialItems, required this.onCartUpdated});
  final List<CartItemData> initialItems;
  final void Function(CartScreenResult) onCartUpdated;
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  late List<CartItemData> _items;
  bool _processing = false;

  bool get _isDark => ThemeController.isDark.value;
  double get _total => _items.fold(0, (s, i) => s + i.subtotal);
  int    get _totalUnits => _items.fold(0, (s, i) => s + i.quantity);
  bool   _hasStockIssue(CartItemData i) => i.stock <= 0 || i.quantity > i.stock;

  @override
  void initState() {
    super.initState();
    _items = widget.initialItems.map((i) => CartItemData(product: i.product, quantity: i.quantity)).toList();
  }

  @override
  void didUpdateWidget(covariant CartScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    setState(() {
      _items = widget.initialItems.map((i) => CartItemData(product: i.product, quantity: i.quantity)).toList();
    });
  }

  void _increase(int i) {
    if (_items[i].quantity >= _items[i].stock) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Text('Límite de stock alcanzado.'),
          backgroundColor: AppColors.amber500));
      return;
    }
    setState(() => _items[i].quantity += 1);
  }

  void _decrease(int i) => setState(() {
    if (_items[i].quantity > 1) {
      _items[i].quantity -= 1;
    } else {
      _items.removeAt(i);
    }
  });

  void _remove(int i) => setState(() => _items.removeAt(i));
  void _clear()       => setState(() => _items = []);

  void _syncToParent() => widget.onCartUpdated(CartScreenResult(items: _items, purchased: false));

  Future<void> _buy() async {
    if (_items.isEmpty) { ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tu carrito está vacío.'))); return; }
    if (_items.any(_hasStockIssue)) { ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ajusta productos sin stock antes de comprar.'))); return; }

    final ok = await showDialog<bool>(context: context, builder: (_) =>
      AlertDialog(
        backgroundColor: _isDark ? AppColors.slate900 : Colors.white,
        shape: const RoundedRectangleBorder(borderRadius: AppRadius.xxl),
        title: Text('Confirmar compra', style: GoogleFonts.inter(fontWeight: FontWeight.w900)),
        content: Text('$_totalUnits producto(s) por \$${_total.toStringAsFixed(2)}.',
            style: GoogleFonts.inter()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(context, true),
              child: const Text('Comprar todo')),
        ],
      ),
    );
    if (ok != true) return;

    setState(() => _processing = true);
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw Exception('Sesión expirada.');
      var processed = 0;
      for (final item in _items) {
        final pid = int.tryParse(item.key);
        if (pid == null) continue;
        for (var j = 0; j < item.quantity; j++) {
          await ApiService.buyProduct(pid, item.unitPrice, user.email ?? '');
          processed++;
        }
      }
      widget.onCartUpdated(CartScreenResult(items: const [], purchased: true, purchasedCount: processed));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.red500));
      }
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = _isDark
        ? [AppColors.darkBgStart, AppColors.darkBgEnd]
        : [AppColors.lightBgStart, AppColors.lightBgEnd];

    return Container(
      decoration: BoxDecoration(gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: colors)),
      child: _items.isEmpty ? _buildEmpty() : _buildCartContent(),
    );
  }

  Widget _buildEmpty() {
    return Center(child: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _isDark ? AppColors.slate800 : AppColors.slate100,
            border: Border.all(color: _isDark ? AppColors.slate700 : AppColors.slate200),
          ),
          child: Icon(Icons.shopping_bag_outlined, size: 38,
              color: _isDark ? AppColors.slate500 : AppColors.slate400),
        ),
        const SizedBox(height: 20),
        Text('Tu carrito está vacío', textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900,
                color: _isDark ? Colors.white : AppColors.slate900)),
        const SizedBox(height: 8),
        Text('Agrega productos desde el catálogo para comprar todo en un paso.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 14, height: 1.5,
                color: _isDark ? AppColors.slate400 : AppColors.slate500)),
      ]),
    ));
  }

  Widget _buildCartContent() {
    final borderTop = _isDark ? AppColors.slate700 : AppColors.slate200;
    final footerBg  = _isDark ? AppColors.slate900.withValues(alpha: 0.95) : Colors.white;

    return Column(children: [
      // ── Summary tiles ──
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
        child: Row(children: [
          _SummaryTile(icon: Icons.local_mall_outlined, label: 'Artículos',
              value: _items.length.toString(), isDark: _isDark),
          const SizedBox(width: 12),
          _SummaryTile(icon: Icons.payments_outlined, label: 'Total',
              value: '\$${_total.toStringAsFixed(2)}', isDark: _isDark),
        ]),
      ),

      // ── Item list ──
      Expanded(child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        itemCount: _items.length,
        separatorBuilder: (context, index) => const SizedBox(height: 12),
        itemBuilder: (_, i) => _CartCard(
          item: _items[i], isDark: _isDark,
          onIncrease: () { _increase(i); _syncToParent(); },
          onDecrease: () { _decrease(i); _syncToParent(); },
          onRemove:   () { _remove(i);   _syncToParent(); },
        ),
      )),

      // ── Footer ──
      Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        decoration: BoxDecoration(
          color: footerBg,
          border: Border(top: BorderSide(color: borderTop)),
          boxShadow: [BoxShadow(
            color: _isDark ? Colors.black.withValues(alpha: 0.25) : AppColors.slate200,
            blurRadius: 12, offset: const Offset(0, -4),
          )],
        ),
        child: SafeArea(top: false, child: Row(children: [
          Expanded(child: SizedBox(height: 52,
            child: OutlinedButton.icon(
              onPressed: _processing ? null : () { _clear(); _syncToParent(); },
              icon: const Icon(Icons.remove_shopping_cart_outlined, size: 18),
              label: const Text('Vaciar'),
            ),
          )),
          const SizedBox(width: 12),
          Expanded(flex: 2, child: SizedBox(height: 52,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: _processing ? null : AppGradients.brand,
                color: _processing ? AppColors.slate300 : null,
                borderRadius: AppRadius.lg,
                boxShadow: _processing ? null : AppShadows.button(isDark: _isDark),
              ),
              child: Material(color: Colors.transparent, borderRadius: AppRadius.lg,
                child: InkWell(
                  borderRadius: AppRadius.lg,
                  onTap: _processing ? null : _buy,
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    if (_processing)
                      const SizedBox(width: 18, height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    else
                      const Icon(Icons.shopping_cart_checkout_outlined, color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Text(_processing ? 'Procesando...' : 'Comprar todo',
                        style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                  ]),
                ),
              ),
            ),
          )),
        ])),
      ),
    ]);
  }
}
