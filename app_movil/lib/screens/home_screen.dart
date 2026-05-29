import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../models/cart_item.dart';
import '../services/api_service.dart';
import '../services/theme_controller.dart';
import '../widgets/theme_fab.dart';
import 'cart_screen.dart';
import 'login_screen.dart';
import 'purchases_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  List<dynamic> _products = [];
  bool _loading = true;
  String? _errorMessage;
  final Map<String, CartItemData> _cart = {};
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    ThemeController.isDark.addListener(_themeListener);
    WidgetsBinding.instance.addObserver(this);
    _loadProducts();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted && !_loading) {
        _loadProducts();
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadProducts();
    }
  }

  void _themeListener() => setState(() {});

  @override
  void dispose() {
    _refreshTimer?.cancel();
    ThemeController.isDark.removeListener(_themeListener);
    WidgetsBinding.instance.removeObserver(this);
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

  double _priceOf(dynamic product) =>
      double.tryParse(product['precio'].toString()) ?? 0;
  int _stockOf(dynamic product) =>
      int.tryParse(product['stock']?.toString() ?? '0') ?? 0;
  String _keyOf(dynamic product) => product['id'].toString();
  int _cartQuantityOf(dynamic product) => _cart[_keyOf(product)]?.quantity ?? 0;

  int _availableStock(dynamic product) {
    final remaining = _stockOf(product) - _cartQuantityOf(product);
    return remaining > 0 ? remaining : 0;
  }

  int get _cartCount =>
      _cart.values.fold<int>(0, (sum, item) => sum + item.quantity);

  Future<void> _loadProducts() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final data = await ApiService.getProducts();
      if (!mounted) return;
      setState(() => _products = data);
    } catch (_) {
      if (!mounted) return;
      setState(() => _errorMessage = 'No se pudieron cargar los productos.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _addToCart(dynamic product) {
    final stock = _stockOf(product);
    final available = _availableStock(product);
    if (stock <= 0 || available <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Ese producto ya no tiene stock disponible.'),
        ),
      );
      return;
    }

    final key = _keyOf(product);
    setState(() {
      final current = _cart[key];
      if (current == null) {
        _cart[key] = CartItemData(product: product, quantity: 1);
      } else {
        current.quantity += 1;
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product['nombre']} agregado al carrito.'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  Future<void> _openCart() async {
    final result = await Navigator.push<CartScreenResult>(
      context,
      MaterialPageRoute(
        builder: (_) => CartScreen(initialItems: _cart.values.toList()),
      ),
    );

    if (!mounted || result == null) return;

    setState(() {
      _cart
        ..clear()
        ..addEntries(result.items.map((item) => MapEntry(item.key, item)));
    });

    if (result.purchased) {
      await _loadProducts();
      if (!mounted) return;
      setState(() => _cart.clear());
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Compra realizada con ${result.purchasedCount} registro(s).',
          ),
          backgroundColor: Colors.green.shade700,
          action: SnackBarAction(
            label: 'Ver compras',
            textColor: Colors.white,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PurchasesScreen()),
              );
            },
          ),
        ),
      );
    }
  }

  Future<void> _signOut() async {
    await FirebaseAuth.instance.signOut();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  Widget _buildCartBadge() {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        IconButton(
          onPressed: _cart.isEmpty ? null : _openCart,
          icon: const Icon(Icons.shopping_cart_outlined),
          tooltip: 'Ver carrito',
        ),
        if (_cartCount > 0)
          Positioned(
            right: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.redAccent,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: Colors.white, width: 1.2),
              ),
              constraints: const BoxConstraints(minWidth: 20),
              child: Text(
                _cartCount.toString(),
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildHero() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _surfaceSoft,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: _border),
      ),
      child: Row(
        children: [
          Container(
            width: 62,
            height: 62,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              gradient: const LinearGradient(
                colors: [Color(0xFF60A5FA), Color(0xFF2563EB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Icon(
              Icons.storefront_outlined,
              color: Colors.white,
              size: 30,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Catálogo para comprar',
                  style: TextStyle(
                    color: _textPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Agrega productos al carrito, revisa tu selección y compra todo en un solo paso.',
                  style: TextStyle(color: _textSecondary, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(dynamic product, int index) {
    final quantityInCart = _cartQuantityOf(product);
    final price = _priceOf(product);
    final stock = _stockOf(product);
    final availableStock = _availableStock(product);
    final isOutOfStock = stock <= 0 || availableStock <= 0;

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 260 + (index * 35)),
      curve: Curves.easeOut,
      builder: (context, value, child) {
        return Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 12 * (1 - value)),
            child: child,
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: _border),
          gradient: _isDarkMode
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF111827), Color(0xFF0F172A)],
                )
              : const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFFFFFFF), Color(0xFFF8FBFF)],
                ),
          boxShadow: [
            BoxShadow(
              color: (_isDarkMode ? Colors.black : Colors.blue).withValues(
                alpha: _isDarkMode ? 0.18 : 0.08,
              ),
              blurRadius: 24,
              offset: const Offset(0, 14),
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
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF38BDF8), Color(0xFF2563EB)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Icon(
                      Icons.shopping_bag_outlined,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product['nombre']?.toString() ?? 'Producto',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: _textPrimary,
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          product['descripcion']?.toString() ??
                              'Producto disponible para compra.',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: _textSecondary, height: 1.35),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Text(
                    '\$${price.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: _isDarkMode
                          ? const Color(0xFF7DD3FC)
                          : const Color(0xFF2563EB),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _isDarkMode
                          ? Colors.white.withValues(alpha: 0.07)
                          : const Color(0xFFE0F2FE),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: _border),
                    ),
                    child: Text(
                      'Stock base: $stock',
                      style: TextStyle(
                        color: _textPrimary,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  isOutOfStock
                      ? 'Sin stock disponible'
                      : 'Disponible para agregar: $availableStock',
                  style: TextStyle(
                    color: isOutOfStock
                        ? const Color(0xFFFCA5A5)
                        : _textSecondary,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
              if (quantityInCart > 0) ...[
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0EA5E9).withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: const Color(0xFF38BDF8).withValues(alpha: 0.18),
                      ),
                    ),
                    child: Text(
                      'Ya agregado en carrito x$quantityInCart',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: isOutOfStock ? null : () => _addToCart(product),
                  icon: const Icon(Icons.add_shopping_cart_outlined),
                  label: Text(
                    isOutOfStock ? 'Sin stock' : 'Agregar al carrito',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _pageEnd,
      appBar: AppBar(
        title: const Text('Catálogo Móvil'),
        centerTitle: false,
        backgroundColor: _isDarkMode ? const Color(0xFF0F172A) : Colors.white,
        foregroundColor: _textPrimary,
        actions: [
          _buildCartBadge(),
          IconButton(
            icon: const Icon(Icons.receipt_long_outlined),
            tooltip: 'Mis compras',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const PurchasesScreen()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar sesión',
            onPressed: _signOut,
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
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : RefreshIndicator(
                      onRefresh: _loadProducts,
                      child: _errorMessage != null
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.all(24),
                              children: [
                                _EmptyState(
                                  icon: Icons.cloud_off_outlined,
                                  title: 'No pudimos cargar el catálogo',
                                  subtitle: _errorMessage!,
                                  isDarkMode: _isDarkMode,
                                ),
                              ],
                            )
                          : _products.isEmpty
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.all(24),
                              children: [
                                _EmptyState(
                                  icon: Icons.inventory_2_outlined,
                                  title: 'No hay productos disponibles',
                                  subtitle:
                                      'Cuando existan productos, aparecerán aquí para agregarlos al carrito.',
                                  isDarkMode: _isDarkMode,
                                ),
                              ],
                            )
                          : ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.fromLTRB(
                                16,
                                16,
                                16,
                                24,
                              ),
                              children: [
                                _buildHero(),
                                const SizedBox(height: 16),
                                ..._products.asMap().entries.map(
                                  (entry) => Padding(
                                    padding: const EdgeInsets.only(bottom: 14),
                                    child: _buildProductCard(
                                      entry.value,
                                      entry.key,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                    ),
            ),
          ),
          const Positioned(right: 16, bottom: 16, child: ThemeFab()),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isDarkMode,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool isDarkMode;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isDarkMode ? Colors.white.withValues(alpha: 0.06) : Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: isDarkMode
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFBFDBFE),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF38BDF8), Color(0xFF2563EB)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Icon(icon, color: Colors.white, size: 34),
          ),
          const SizedBox(height: 18),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isDarkMode ? Colors.white : const Color(0xFF0F172A),
              fontSize: 21,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isDarkMode
                  ? Colors.white.withValues(alpha: 0.70)
                  : const Color(0xFF475569),
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}
