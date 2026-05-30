import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';

import '../services/api_service.dart';
import '../services/theme_controller.dart';
import '../theme/app_theme.dart';

// ── Status helpers ────────────────────────────────────────────
String _formatStatus(dynamic v) {
  final raw = (v ?? 'PENDIENTE').toString().trim().toUpperCase();
  if (raw == 'VALIDADA'  || raw == 'VALIDADO')   return 'Validado';
  if (raw == 'RECHAZADA' || raw == 'RECHAZADO')  return 'Rechazado';
  return 'Pendiente';
}

// ── Status badge ──────────────────────────────────────────────
class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status, required this.isDark});
  final String status;
  final bool   isDark;
  @override
  Widget build(BuildContext context) {
    late Color bg, fg, border;
    late IconData icon;
    if (status == 'Validado') {
      bg = AppColors.emerald500.withValues(alpha: 0.12);
      fg = isDark ? AppColors.emerald400 : AppColors.emerald600;
      border = AppColors.emerald500.withValues(alpha: 0.25);
      icon = Icons.check_circle_outline_rounded;
    } else if (status == 'Rechazado') {
      bg = AppColors.red500.withValues(alpha: 0.12);
      fg = isDark ? AppColors.red400 : AppColors.red500;
      border = AppColors.red500.withValues(alpha: 0.25);
      icon = Icons.cancel_outlined;
    } else {
      bg = AppColors.amber500.withValues(alpha: 0.12);
      fg = isDark ? AppColors.amber400 : AppColors.amber500;
      border = AppColors.amber500.withValues(alpha: 0.25);
      icon = Icons.pending_outlined;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: AppRadius.full, border: Border.all(color: border)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 13, color: fg),
        const SizedBox(width: 5),
        Text(status, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: fg)),
      ]),
    );
  }
}

// ── Shimmer skeleton ──────────────────────────────────────────
class _PurchaseSkeleton extends StatelessWidget {
  const _PurchaseSkeleton({required this.isDark});
  final bool isDark;
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: isDark ? AppColors.slate800 : AppColors.slate200,
      highlightColor: isDark ? AppColors.slate700 : AppColors.slate100,
      child: Column(children: List.generate(4, (_) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
        child: Container(height: 112,
            decoration: BoxDecoration(color: Colors.white, borderRadius: AppRadius.xxl)),
      ))),
    );
  }
}

// ── Purchase card ─────────────────────────────────────────────
class _PurchaseCard extends StatelessWidget {
  const _PurchaseCard({
    required this.purchase, required this.isDark, required this.onTap,
    required this.formatDate, required this.formatValue,
  });
  final Map<String, dynamic> purchase;
  final bool isDark;
  final VoidCallback onTap;
  final String Function(dynamic) formatDate;
  final String Function(dynamic) formatValue;

  @override
  Widget build(BuildContext context) {
    final invoice = purchase['id_factura'] ?? purchase['factura'] ?? purchase['invoice'] ?? purchase['id'];
    final status  = _formatStatus(purchase['estado_factura'] ?? purchase['estado'] ?? purchase['status']);
    final items   = purchase['detalle'] ?? purchase['detalles'] ?? purchase['items'] ?? purchase['productos'];
    final count   = items is List
        ? items.length
        : (int.tryParse((purchase['cantidad'] ?? 1).toString()) ?? 1);
    final total   = formatValue(purchase['total'] ?? purchase['monto_total'] ?? purchase['total_venta']);

    return GestureDetector(
      onTap: onTap,
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
            Row(children: [
              Container(width: 52, height: 52,
                decoration: const BoxDecoration(gradient: AppGradients.brand, borderRadius: AppRadius.lg),
                child: const Icon(Icons.receipt_long_outlined, color: Colors.white)),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Factura #${invoice?.toString() ?? 'N/D'}',
                    style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : AppColors.slate900)),
                const SizedBox(height: 3),
                Text(formatDate(purchase['fecha_factura'] ?? purchase['created_at'] ??
                    purchase['fecha'] ?? purchase['date']),
                    style: GoogleFonts.inter(fontSize: 13,
                        color: isDark ? AppColors.slate400 : AppColors.slate500)),
              ])),
              const Icon(Icons.chevron_right_rounded, size: 22, color: AppColors.slate400),
            ]),
            const SizedBox(height: 12),
            Wrap(spacing: 8, runSpacing: 8, children: [
              _StatusBadge(status: status, isDark: isDark),
              _Chip(label: '$count productos', isDark: isDark),
              _Chip(label: '\$$total', isDark: isDark, highlight: true),
            ]),
          ]),
        ),
      ),
    );
  }
}

// ── Mini chip ─────────────────────────────────────────────────
class _Chip extends StatelessWidget {
  const _Chip({required this.label, required this.isDark, this.highlight = false});
  final String label;
  final bool isDark, highlight;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: highlight
            ? AppColors.blue500.withValues(alpha: 0.12)
            : (isDark ? AppColors.slate800 : AppColors.slate100),
        borderRadius: AppRadius.full,
        border: highlight ? Border.all(color: AppColors.blue500.withValues(alpha: 0.25)) : null,
      ),
      child: Text(label, style: GoogleFonts.inter(
          fontSize: 12, fontWeight: FontWeight.w700,
          color: highlight
              ? (isDark ? AppColors.blue400 : AppColors.blue600)
              : (isDark ? AppColors.slate300 : AppColors.slate600))),
    );
  }
}

// ── Detail chip ───────────────────────────────────────────────
class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.icon, required this.label, required this.value, required this.isDark});
  final IconData icon;
  final String label, value;
  final bool isDark;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppColors.slate800.withValues(alpha: 0.6) : AppColors.slate50,
        borderRadius: AppRadius.lg,
        border: Border.all(color: isDark ? AppColors.slate700 : AppColors.slate200),
      ),
      child: Row(children: [
        Icon(icon, size: 18, color: isDark ? AppColors.slate400 : AppColors.slate500),
        const SizedBox(width: 10),
        Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w600,
            color: isDark ? AppColors.slate400 : AppColors.slate500)),
        const Spacer(),
        Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppColors.slate900)),
      ]),
    );
  }
}

// ── PurchasesScreen ───────────────────────────────────────────
class PurchasesScreen extends StatefulWidget {
  const PurchasesScreen({super.key});
  @override
  State<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  List<dynamic> _purchases = [];
  bool  _loading = true;
  String? _error;

  bool get _isDark => ThemeController.isDark.value;

  @override
  void initState() {
    super.initState();
    ThemeController.isDark.addListener(_rebuild);
    _loadPurchases();
  }

  void _rebuild() => setState(() {});

  @override
  void dispose() {
    ThemeController.isDark.removeListener(_rebuild);
    super.dispose();
  }

  Future<void> _loadPurchases() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) throw Exception('Sesión expirada.');
      final data = await ApiService.getPurchases(user.uid);
      if (!mounted) return;
      setState(() => _purchases = data);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'No se pudieron cargar las compras.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatDate(dynamic v) {
    if (v == null) return 'Fecha no disponible';
    final raw = v.toString().replaceFirst('T', ' ').replaceFirst(RegExp(r'Z$'), '');
    final parts = raw.split(' ');
    if (parts.isEmpty) return raw;
    final dateParts = parts.first.split('-');
    if (dateParts.length != 3) return raw;
    final time = parts.length > 1 ? parts[1].split('.').first : '00:00:00';
    final tp   = time.split(':');
    return '${dateParts[2].padLeft(2,'0')}/${dateParts[1].padLeft(2,'0')}/${dateParts[0]} '
        '${tp.isNotEmpty ? tp[0].padLeft(2,'0') : '00'}:${tp.length > 1 ? tp[1].padLeft(2,'0') : '00'}';
  }

  String _formatValue(dynamic v) {
    final d = double.tryParse((v ?? 0).toString());
    return d == null ? '0.00' : d.toStringAsFixed(2);
  }

  Map<String, dynamic> _asMap(dynamic v) {
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return v.map((k, dynamic item) => MapEntry(k.toString(), item));
    return {};
  }

  List<Map<String, dynamic>> _items(Map<String, dynamic> p) {
    final raw = p['detalle'] ?? p['detalles'] ?? p['items'] ?? p['productos'] ?? [];
    if (raw is List) return raw.map(_asMap).toList();
    if (raw is Map) {
      final itemMap = Map<String, dynamic>.from(_asMap(raw));
      if (!itemMap.containsKey('cantidad')) {
        itemMap['cantidad'] = p['cantidad'] ?? 1;
      }
      return [itemMap];
    }
    return [];
  }

  void _showDetails(Map<String, dynamic> purchase) {
    final items   = _items(purchase);
    final invoice = purchase['id_factura'] ?? purchase['factura'] ?? purchase['invoice'] ?? purchase['id'];
    final status  = _formatStatus(purchase['estado_factura'] ?? purchase['estado'] ?? purchase['status']);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: BoxDecoration(
          color: _isDark ? AppColors.slate900 : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          border: Border(top: BorderSide(color: _isDark ? AppColors.slate700 : AppColors.slate200)),
        ),
        child: DraggableScrollableSheet(
          initialChildSize: 0.88, minChildSize: 0.55, maxChildSize: 0.95, expand: false,
          builder: (_, controller) => ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
            children: [
              // Drag handle
              Center(child: Container(width: 44, height: 5,
                  decoration: BoxDecoration(
                    color: _isDark ? AppColors.slate700 : AppColors.slate200,
                    borderRadius: AppRadius.full))),
              const SizedBox(height: 20),

              // Header
              Row(children: [
                Container(width: 48, height: 48,
                  decoration: const BoxDecoration(gradient: AppGradients.brand, borderRadius: AppRadius.lg),
                  child: const Icon(Icons.receipt_long_outlined, color: Colors.white)),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Factura #${invoice?.toString() ?? 'N/D'}',
                      style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900,
                          color: _isDark ? Colors.white : AppColors.slate900)),
                  const SizedBox(height: 4),
                  _StatusBadge(status: status, isDark: _isDark),
                ])),
              ]),
              const SizedBox(height: 18),

              // Detail rows
              _DetailRow(icon: Icons.calendar_today_outlined, label: 'Fecha', isDark: _isDark,
                  value: _formatDate(purchase['fecha_factura'] ?? purchase['created_at'] ??
                      purchase['fecha'] ?? purchase['date'])),
              const SizedBox(height: 10),
              _DetailRow(icon: Icons.payments_outlined, label: 'Total', isDark: _isDark,
                  value: '\$${_formatValue(purchase['total'] ?? purchase['monto_total'] ?? purchase['total_venta'])}'),
              const SizedBox(height: 10),
              _DetailRow(icon: Icons.inventory_2_outlined, label: 'Productos', isDark: _isDark,
                  value: items.length.toString()),
              const SizedBox(height: 20),

              // Items
              Text('Detalle de productos', style: GoogleFonts.inter(
                  fontSize: 16, fontWeight: FontWeight.w800,
                  color: _isDark ? Colors.white : AppColors.slate900)),
              const SizedBox(height: 12),
              if (items.isEmpty)
                Container(padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _isDark ? AppColors.slate800 : AppColors.slate50,
                    borderRadius: AppRadius.lg,
                    border: Border.all(color: _isDark ? AppColors.slate700 : AppColors.slate200),
                  ),
                  child: Text('Sin detalle estructurado.',
                      style: GoogleFonts.inter(color: _isDark ? AppColors.slate400 : AppColors.slate500)))
              else
                ...items.map((item) {
                  final name    = (item['nombre'] ?? item['producto'] ?? item['name'] ?? 'Producto').toString();
                  final qty     = int.tryParse((item['cantidad'] ?? item['qty'] ?? 1).toString()) ?? 1;
                  final price   = double.tryParse((item['precio'] ?? item['precio_unitario'] ?? item['price'] ?? 0).toString()) ?? 0;
                  final sub     = double.tryParse((item['total'] ?? item['subtotal'] ?? price * qty).toString()) ?? price * qty;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: _isDark ? AppColors.slate800.withValues(alpha: 0.6) : Colors.white,
                        borderRadius: AppRadius.lg,
                        border: Border.all(color: _isDark ? AppColors.slate700 : AppColors.slate200),
                      ),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Expanded(child: Text(name, style: GoogleFonts.inter(
                              fontWeight: FontWeight.w800,
                              color: _isDark ? Colors.white : AppColors.slate900))),
                          Text('×$qty', style: GoogleFonts.inter(fontWeight: FontWeight.w700,
                              color: _isDark ? AppColors.slate400 : AppColors.slate500)),
                        ]),
                        const SizedBox(height: 8),
                        Wrap(spacing: 8, runSpacing: 6, children: [
                          _Chip(label: 'Precio \$${price.toStringAsFixed(2)}', isDark: _isDark),
                          _Chip(label: 'Total \$${sub.toStringAsFixed(2)}', isDark: _isDark, highlight: true),
                        ]),
                      ]),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = _isDark
        ? [AppColors.darkBgStart, AppColors.darkBgEnd]
        : [AppColors.lightBgStart, AppColors.lightBgEnd];

    return Container(
      decoration: BoxDecoration(gradient: LinearGradient(
          begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: colors)),
      child: _loading
          ? _PurchaseSkeleton(isDark: _isDark)
          : RefreshIndicator(
              onRefresh: _loadPurchases,
              color: AppColors.blue500,
              child: _error != null
                  ? ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.all(24),
                      children: [_EmptyState(icon: Icons.receipt_long_outlined, title: 'Sin conexión',
                          subtitle: _error!, isDark: _isDark)])
                  : _purchases.isEmpty
                      ? ListView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.all(24),
                          children: [_EmptyState(icon: Icons.receipt_outlined, title: 'Sin compras aún',
                              subtitle: 'Cuando compres desde el carrito verás tus facturas aquí.',
                              isDark: _isDark)])
                      : ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                          itemCount: _purchases.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 14),
                          itemBuilder: (_, i) {
                            final p = _asMap(_purchases[i]);
                            return _PurchaseCard(
                              purchase: p, isDark: _isDark,
                              onTap: () => _showDetails(p),
                              formatDate: _formatDate, formatValue: _formatValue,
                            );
                          },
                        ),
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
