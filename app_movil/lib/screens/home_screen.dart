import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';

import '../models/cart_item.dart';
import '../services/api_service.dart';
import '../services/theme_controller.dart';
import '../theme/app_theme.dart';
import '../widgets/app_bottom_nav.dart';
import 'cart_screen.dart';
import 'login_screen.dart';
import 'purchases_screen.dart';

// ── Stock badge ───────────────────────────────────────────────
class _StockBadge extends StatelessWidget {
  const _StockBadge({required this.stock, required this.isDark});
  final int  stock;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    late Color bg, fg, border;
    late String text;
    if (stock <= 0) {
      bg = AppColors.red500.withValues(alpha: 0.12);
      fg = isDark ? AppColors.red400 : AppColors.red500;
      border = AppColors.red500.withValues(alpha: 0.25);
      text = 'Sin stock';
    } else if (stock <= 10) {
      bg = AppColors.amber500.withValues(alpha: 0.12);
      fg = isDark ? AppColors.amber400 : AppColors.amber500;
      border = AppColors.amber500.withValues(alpha: 0.25);
      text = 'Stock: $stock';
    } else {
      bg = AppColors.emerald500.withValues(alpha: 0.12);
      fg = isDark ? AppColors.emerald400 : AppColors.emerald500;
      border = AppColors.emerald500.withValues(alpha: 0.25);
      text = 'Stock: $stock';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.full,
          border: Border.all(color: border)),
      child: Text(text, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
    );
  }
}

// ── Shimmer skeleton ──────────────────────────────────────────
class _ProductSkeleton extends StatelessWidget {
  const _ProductSkeleton({required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final base = isDark ? AppColors.slate800 : AppColors.slate200;
    final highlight = isDark ? AppColors.slate700 : AppColors.slate100;
    return Shimmer.fromColors(
      baseColor: base,
      highlightColor: highlight,
      child: Column(children: List.generate(4, (i) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
        child: Container(
          height: 140,
          decoration: BoxDecoration(color: Colors.white, borderRadius: AppRadius.xxl),
        ),
      ))),
    );
  }
}

// ── Product card ──────────────────────────────────────────────
class _ProductCard extends StatelessWidget {
  const _ProductCard({
    required this.product, required this.index,
    required this.isDark, required this.quantityInCart,
    required this.availableStock, required this.onAdd,
  });
  final dynamic  product;
  final int      index;
  final bool     isDark;
  final int      quantityInCart;
  final int      availableStock;
  final VoidCallback onAdd;

  Color _colorFromName(String name) {
    final hue = name.codeUnits.fold(0, (a, b) => a + b) % 360;
    return HSLColor.fromAHSL(1, hue.toDouble(), 0.65, isDark ? 0.55 : 0.50).toColor();
  }

  @override
  Widget build(BuildContext context) {
    final price    = double.tryParse(product['precio'].toString()) ?? 0;
    final stock    = int.tryParse(product['stock']?.toString() ?? '0') ?? 0;
    final isOut    = stock <= 0 || availableStock <= 0;
    final name     = product['nombre']?.toString() ?? 'Producto';
    final desc     = product['descripcion']?.toString() ?? '';
    final iconColor = _colorFromName(name);

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 280 + index * 40),
      curve: Curves.easeOutCubic,
      builder: (_, v, child) => Opacity(opacity: v,
          child: Transform.translate(offset: Offset(0, 16 * (1 - v)), child: child)),
      child: Container(
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
              // Icon
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  borderRadius: AppRadius.lg,
                  gradient: LinearGradient(
                    colors: [iconColor, HSLColor.fromColor(iconColor)
                        .withLightness((HSLColor.fromColor(iconColor).lightness - 0.12).clamp(0, 1)).toColor()],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                ),
                child: const Icon(Icons.inventory_2_outlined, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(name, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppColors.slate900)),
                if (desc.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(desc, maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(fontSize: 13, height: 1.35,
                          color: isDark ? AppColors.slate400 : AppColors.slate500)),
                ],
              ])),
            ]),

            const SizedBox(height: 14),

            Row(children: [
              // Price
              Text('\$${price.toStringAsFixed(2)}',
                  style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900,
                      color: isDark ? AppColors.blue400 : AppColors.blue600)),
              const Spacer(),
              _StockBadge(stock: availableStock, isDark: isDark),
            ]),

            if (availableStock > 0 && !isOut) ...[
              const SizedBox(height: 6),
              Text('Disponible para añadir: $availableStock',
                  style: GoogleFonts.inter(fontSize: 12, color: isDark ? AppColors.slate400 : AppColors.slate500)),
            ],

            if (quantityInCart > 0) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: AppColors.blue500.withValues(alpha: 0.12),
                  borderRadius: AppRadius.full,
                  border: Border.all(color: AppColors.blue500.withValues(alpha: 0.25)),
                ),
                child: Text('En carrito ×$quantityInCart',
                    style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700,
                        color: isDark ? AppColors.blue400 : AppColors.blue600)),
              ),
            ],

            const SizedBox(height: 14),

            // Add to cart button
            SizedBox(
              width: double.infinity,
              height: 46,
              child: isOut
                  ? OutlinedButton.icon(
                      onPressed: null,
                      icon: const Icon(Icons.block_outlined, size: 18),
                      label: const Text('Sin stock'),
                    )
                  : DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: AppGradients.brand,
                        borderRadius: AppRadius.lg,
                        boxShadow: AppShadows.button(isDark: isDark),
                      ),
                      child: Material(color: Colors.transparent, borderRadius: AppRadius.lg,
                        child: InkWell(
                          borderRadius: AppRadius.lg, onTap: onAdd,
                          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 6),
                            Text('Agregar al carrito',
                                style: GoogleFonts.inter(color: Colors.white,
                                    fontWeight: FontWeight.w700, fontSize: 14)),
                          ]),
                        ),
                      ),
                    ),
            ),
          ]),
        ),
      ),
    );
  }
}

// ── HomeScreen (with Bottom Nav) ──────────────────────────────
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  int _tabIndex = 0;
  int _purchasesReloadCount = 0;
  List<dynamic> _products = [];
  bool _loading    = true;
  String? _error;
  String? _dbName;
  final Map<String, CartItemData> _cart = {};
  Timer? _refreshTimer;

  bool get _isDark => ThemeController.isDark.value;

  @override
  void initState() {
    super.initState();
    ThemeController.isDark.addListener(_rebuild);
    WidgetsBinding.instance.addObserver(this);
    _loadProducts();
    _loadUserProfile();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted && !_loading) _loadProducts();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadProducts();
      _loadUserProfile();
    }
  }

  void _rebuild() => setState(() {});

  @override
  void dispose() {
    _refreshTimer?.cancel();
    ThemeController.isDark.removeListener(_rebuild);
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  int    _stockOf(dynamic p)  => int.tryParse(p['stock']?.toString() ?? '0') ?? 0;
  String _keyOf(dynamic p)    => p['id'].toString();
  int    _cartQty(dynamic p)  => _cart[_keyOf(p)]?.quantity ?? 0;
  int    _available(dynamic p) { final r = _stockOf(p) - _cartQty(p); return r > 0 ? r : 0; }
  int get _cartCount => _cart.values.fold<int>(0, (s, i) => s + i.quantity);

  // ── Data ──
  Future<void> _loadProducts() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final data = await ApiService.getProducts();
      if (!mounted) return;
      setState(() => _products = data);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'No se pudieron cargar los productos.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _addToCart(dynamic product) {
    final available = _available(product);
    if (_stockOf(product) <= 0 || available <= 0) {
      _showSnack('Sin stock disponible.', isError: true);
      return;
    }
    final key = _keyOf(product);
    setState(() {
      final c = _cart[key];
      if (c == null) {
        _cart[key] = CartItemData(product: product, quantity: 1);
      } else {
        c.quantity += 1;
      }
    });
    _showSnack('${product['nombre']} agregado 🛒');
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Row(children: [
        Icon(isError ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
            color: Colors.white, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(msg)),
      ]),
      backgroundColor: isError ? AppColors.red500 : AppColors.emerald600,
    ));
  }


  Future<void> _signOut() async {
    await FirebaseAuth.instance.signOut();
    if (!mounted) return;
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  Future<void> _loadUserProfile() async {
    try {
      final u = FirebaseAuth.instance.currentUser;
      if (u != null) {
        final profile = await ApiService.getUser(u.uid);
        if (profile != null && profile['nombre'] != null) {
          if (mounted) {
            setState(() {
              _dbName = profile['nombre'].toString();
            });
          }
        }
      }
    } catch (_) {}
  }

  String get _userName {
    if (_dbName != null && _dbName!.trim().isNotEmpty) {
      return _dbName!.trim().split(' ').first;
    }
    final u = FirebaseAuth.instance.currentUser;
    return u?.displayName?.trim().isNotEmpty == true
        ? u!.displayName!.split(' ').first
        : u?.email?.split('@').first ?? 'Cliente';
  }

  // ── Catalog Tab ──
  Widget _buildCatalog() {
    final colors = _isDark
        ? [AppColors.darkBgStart, AppColors.darkBgEnd]
        : [AppColors.lightBgStart, AppColors.lightBgEnd];

    return Container(
      decoration: BoxDecoration(gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: colors)),
      child: RefreshIndicator(
        onRefresh: _loadProducts,
        color: AppColors.blue500,
        child: _loading
            ? _ProductSkeleton(isDark: _isDark)
            : _error != null
                ? _buildError()
                : _products.isEmpty
                    ? _buildEmpty()
                    : CustomScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        slivers: [
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                            sliver: SliverToBoxAdapter(child: _buildHero()),
                          ),
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
                            sliver: SliverList(delegate: SliverChildBuilderDelegate(
                              (_, i) => Padding(
                                padding: const EdgeInsets.only(bottom: 14),
                                child: _ProductCard(
                                  product: _products[i], index: i,
                                  isDark: _isDark,
                                  quantityInCart: _cartQty(_products[i]),
                                  availableStock: _available(_products[i]),
                                  onAdd: () => _addToCart(_products[i]),
                                ),
                              ),
                              childCount: _products.length,
                            )),
                          ),
                        ],
                      ),
      ),
    );
  }

  Widget _buildHero() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _isDark ? AppColors.slate900.withValues(alpha: 0.8) : Colors.white.withValues(alpha: 0.9),
        borderRadius: AppRadius.xxl,
        border: Border.all(color: _isDark ? AppColors.slate700 : AppColors.slate200),
        boxShadow: AppShadows.card(isDark: _isDark),
      ),
      child: Row(children: [
        Container(
          width: 56, height: 56,
          decoration: const BoxDecoration(gradient: AppGradients.brand, borderRadius: AppRadius.lg),
          child: const Icon(Icons.storefront_outlined, color: Colors.white, size: 28),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Hola, $_userName 👋',
              style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w900,
                  color: _isDark ? Colors.white : AppColors.slate900)),
          const SizedBox(height: 4),
          Text('Explora el catálogo y añade tus productos favoritos.',
              style: GoogleFonts.inter(fontSize: 13, height: 1.4,
                  color: _isDark ? AppColors.slate400 : AppColors.slate500)),
        ])),
      ]),
    );
  }

  Widget _buildError() => ListView(
    physics: const AlwaysScrollableScrollPhysics(),
    padding: const EdgeInsets.all(24),
    children: [_EmptyState(
      icon: Icons.cloud_off_outlined, isDark: _isDark,
      title: 'Sin conexión al catálogo', subtitle: _error!,
    )],
  );

  Widget _buildEmpty() => ListView(
    physics: const AlwaysScrollableScrollPhysics(),
    padding: const EdgeInsets.all(24),
    children: [_EmptyState(
      icon: Icons.inventory_2_outlined, isDark: _isDark,
      title: 'Catálogo vacío', subtitle: 'Cuando existan productos aparecerán aquí.',
    )],
  );

  // ── Cart tab wrapper ──
  Widget _buildCartTab() => CartScreen(
    initialItems: _cart.values.toList(),
    onCartUpdated: (result) {
      if (!mounted) return;
      setState(() {
        _cart..clear()..addEntries(result.items.map((i) => MapEntry(i.key, i)));
      });
      if (result.purchased) {
        _loadProducts();
        if (mounted) setState(() { _cart.clear(); _tabIndex = 2; _purchasesReloadCount++; });
        _showSnack('Compra realizada con ${result.purchasedCount} registro(s). ✅');
      }
    },
  );

  // ── Main build ──
  @override
  Widget build(BuildContext context) {
    final appBarBg = _isDark ? AppColors.darkBgStart : Colors.white;
    final appBarFg = _isDark ? Colors.white : AppColors.slate900;

    final bodies = [
      _buildCatalog(),
      _buildCartTab(),
      PurchasesScreen(key: ValueKey('purchases_reload_$_purchasesReloadCount')),
    ];

    final titles = ['Catálogo', 'Mi carrito', 'Mis compras'];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: appBarBg,
        foregroundColor: appBarFg,
        title: Row(children: [
          Container(
            height: 32, width: 32,
            decoration: const BoxDecoration(gradient: AppGradients.brand, borderRadius: AppRadius.sm),
            child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 10),
          Text(titles[_tabIndex], style: GoogleFonts.inter(
              fontWeight: FontWeight.w800, fontSize: 18,
              color: appBarFg)),
        ]),
        actions: [
          // Theme toggle
          Padding(
            padding: const EdgeInsets.only(right: 4),
            child: IconButton(
              icon: Icon(_isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined, size: 22),
              tooltip: _isDark ? 'Modo claro' : 'Modo oscuro',
              onPressed: ThemeController.toggle,
            ),
          ),
          // Sign out
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: const Icon(Icons.logout_rounded, size: 22),
              tooltip: 'Cerrar sesión',
              onPressed: _signOut,
            ),
          ),
        ],
      ),
      body: IndexedStack(index: _tabIndex, children: bodies),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _tabIndex,
        cartCount: _cartCount,
        onTap: (i) => setState(() {
          _tabIndex = i;
          if (i == 2) {
            _purchasesReloadCount++;
          }
        }),
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.title, required this.subtitle, required this.isDark});
  final IconData icon;
  final String title, subtitle;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: isDark ? AppColors.slate900 : Colors.white,
        borderRadius: AppRadius.xxl,
        border: Border.all(color: isDark ? AppColors.slate700 : AppColors.slate200),
        boxShadow: AppShadows.card(isDark: isDark),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 72, height: 72,
          decoration: const BoxDecoration(gradient: AppGradients.brand, shape: BoxShape.circle),
          child: Icon(icon, color: Colors.white, size: 34)),
        const SizedBox(height: 18),
        Text(title, textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppColors.slate900)),
        const SizedBox(height: 8),
        Text(subtitle, textAlign: TextAlign.center,
            style: GoogleFonts.inter(height: 1.5,
                color: isDark ? AppColors.slate400 : AppColors.slate500)),
      ]),
    );
  }
}
