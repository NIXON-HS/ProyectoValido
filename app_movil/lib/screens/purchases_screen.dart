import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';

import '../services/api_service.dart';
import '../services/theme_controller.dart';
import '../widgets/theme_fab.dart';

String _formatPurchaseStatus(dynamic value) {
  final raw = (value ?? 'PENDIENTE').toString().trim().toUpperCase();
  if (raw.isEmpty || raw == 'PENDIENTE') return 'Pendiente';
  if (raw == 'VALIDADA' || raw == 'VALIDADO') return 'Validado';
  if (raw == 'RECHAZADA' || raw == 'RECHAZADO') return 'Rechazado';
  return raw[0] + raw.substring(1).toLowerCase();
}

class PurchasesScreen extends StatefulWidget {
  const PurchasesScreen({super.key});

  @override
  State<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  List<dynamic> _purchases = [];
  bool _loading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    ThemeController.isDark.addListener(_themeListener);
    _loadPurchases();
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
  Color get _border => _isDarkMode
      ? Colors.white.withValues(alpha: 0.08)
      : const Color(0xFFBFDBFE);
  Color get _textPrimary =>
      _isDarkMode ? Colors.white : const Color(0xFF0F172A);
  Color get _textSecondary => _isDarkMode
      ? Colors.white.withValues(alpha: 0.72)
      : const Color(0xFF475569);

  Future<void> _loadPurchases() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        throw Exception('Debes iniciar sesión nuevamente.');
      }

      final data = await ApiService.getPurchases(user.uid);
      if (!mounted) return;
      setState(() => _purchases = data);
    } catch (_) {
      if (!mounted) return;
      setState(() => _errorMessage = 'No se pudieron cargar las compras.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatDate(dynamic value) {
    if (value == null) return 'Fecha no disponible';
    final raw = value
        .toString()
        .replaceFirst('T', ' ')
        .replaceFirst(RegExp(r'Z$'), '');
    final parts = raw.split(' ');
    if (parts.isEmpty) return raw;

    final dateParts = parts.first.split('-');
    if (dateParts.length != 3) return raw;

    final day = dateParts[2].padLeft(2, '0');
    final month = dateParts[1].padLeft(2, '0');
    final year = dateParts[0];
    final time = parts.length > 1 ? parts[1].split('.').first : '00:00:00';
    final timeParts = time.split(':');
    final hours = timeParts.isNotEmpty ? timeParts[0].padLeft(2, '0') : '00';
    final minutes = timeParts.length > 1 ? timeParts[1].padLeft(2, '0') : '00';
    final seconds = timeParts.length > 2 ? timeParts[2].padLeft(2, '0') : '00';
    return '$day/$month/$year $hours:$minutes:$seconds';
  }

  String _formatValue(dynamic value) {
    final parsed = double.tryParse((value ?? 0).toString());
    return parsed == null ? '0.00' : parsed.toStringAsFixed(2);
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, dynamic item) => MapEntry(key.toString(), item));
    }
    return {};
  }

  List<Map<String, dynamic>> _itemsFromPurchase(Map<String, dynamic> purchase) {
    final rawItems =
        purchase['detalle'] ??
        purchase['detalles'] ??
        purchase['items'] ??
        purchase['productos'] ??
        [];
    if (rawItems is List) {
      return rawItems.map((item) => _asMap(item)).toList();
    }
    if (rawItems is Map) {
      return [_asMap(rawItems)];
    }
    return [];
  }

  String _invoiceLabel(Map<String, dynamic> purchase) {
    final invoice =
        purchase['id_factura'] ??
        purchase['factura'] ??
        purchase['invoice'] ??
        purchase['id'];
    return 'Factura #${invoice?.toString() ?? 'N/D'}';
  }

  String _statusLabel(Map<String, dynamic> purchase) {
    return _formatPurchaseStatus(
      purchase['estado_factura'] ?? purchase['estado'] ?? purchase['status'],
    );
  }

  bool _isValidated(Map<String, dynamic> purchase) {
    return _formatPurchaseStatus(
          purchase['estado_factura'] ??
              purchase['estado'] ??
              purchase['status'],
        ) ==
        'Validado';
  }

  void _showDetails(Map<String, dynamic> purchase) {
    final items = _itemsFromPurchase(purchase);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: BoxDecoration(
            color: _surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border(top: BorderSide(color: _border)),
          ),
          child: DraggableScrollableSheet(
            initialChildSize: 0.88,
            minChildSize: 0.55,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) {
              return ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                children: [
                  Center(
                    child: Container(
                      width: 46,
                      height: 5,
                      decoration: BoxDecoration(
                        color: _isDarkMode
                            ? Colors.white24
                            : const Color(0xFFBFDBFE),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    _invoiceLabel(purchase),
                    style: TextStyle(
                      color: _textPrimary,
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _statusLabel(purchase),
                    style: TextStyle(
                      color: _textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (_isValidated(purchase)) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(
                          color: const Color(
                            0xFF10B981,
                          ).withValues(alpha: 0.24),
                        ),
                      ),
                      child: const Text(
                        'Validado',
                        style: TextStyle(
                          color: Color(0xFF10B981),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  _DetailChip(
                    label: 'Fecha',
                    value: _formatDate(
                      purchase['fecha_factura'] ??
                          purchase['created_at'] ??
                          purchase['fecha'] ??
                          purchase['date'],
                    ),
                    isDarkMode: _isDarkMode,
                  ),
                  const SizedBox(height: 10),
                  _DetailChip(
                    label: 'Total',
                    value:
                        '\$${_formatValue(purchase['total'] ?? purchase['monto_total'] ?? purchase['total_venta'])}',
                    isDarkMode: _isDarkMode,
                  ),
                  const SizedBox(height: 10),
                  _DetailChip(
                    label: 'Productos',
                    value: items.length.toString(),
                    isDarkMode: _isDarkMode,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Detalle de productos',
                    style: TextStyle(
                      color: _textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (items.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: _isDarkMode
                            ? Colors.white.withValues(alpha: 0.05)
                            : const Color(0xFFF8FBFF),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: _border),
                      ),
                      child: Text(
                        'No se encontró un detalle estructurado para esta compra.',
                        style: TextStyle(color: _textSecondary),
                      ),
                    )
                  else
                    ...items.asMap().entries.map((entry) {
                      final item = entry.value;
                      final name =
                          (item['nombre'] ??
                                  item['producto'] ??
                                  item['name'] ??
                                  'Producto')
                              .toString();
                      final quantity =
                          int.tryParse(
                            (item['cantidad'] ?? item['qty'] ?? 1).toString(),
                          ) ??
                          1;
                      final price =
                          double.tryParse(
                            (item['precio'] ??
                                    item['precio_unitario'] ??
                                    item['price'] ??
                                    0)
                                .toString(),
                          ) ??
                          0;
                      final subtotal =
                          double.tryParse(
                            (item['total'] ??
                                    item['subtotal'] ??
                                    (price * quantity))
                                .toString(),
                          ) ??
                          (price * quantity);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: _isDarkMode
                                ? Colors.white.withValues(alpha: 0.05)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: _border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      name,
                                      style: TextStyle(
                                        color: _textPrimary,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    'x$quantity',
                                    style: TextStyle(
                                      color: _textSecondary,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _MiniChip(
                                    label:
                                        'Precio \$${price.toStringAsFixed(2)}',
                                    isDarkMode: _isDarkMode,
                                  ),
                                  _MiniChip(
                                    label:
                                        'Total \$${subtotal.toStringAsFixed(2)}',
                                    isDarkMode: _isDarkMode,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _pageEnd,
      appBar: AppBar(
        title: const Text('Mis compras'),
        centerTitle: false,
        backgroundColor: _isDarkMode ? const Color(0xFF0F172A) : Colors.white,
        foregroundColor: _textPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loading ? null : _loadPurchases,
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
                      onRefresh: _loadPurchases,
                      child: _errorMessage != null
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.all(24),
                              children: [
                                _EmptyState(
                                  icon: Icons.receipt_long_outlined,
                                  title: 'No pudimos cargar tus compras',
                                  subtitle: _errorMessage!,
                                  isDarkMode: _isDarkMode,
                                ),
                              ],
                            )
                          : _purchases.isEmpty
                          ? ListView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.all(24),
                              children: [
                                _EmptyState(
                                  icon: Icons.receipt_outlined,
                                  title: 'Todavía no tienes compras',
                                  subtitle:
                                      'Cuando compres desde el carrito, aquí verás tus facturas y su detalle.',
                                  isDarkMode: _isDarkMode,
                                ),
                              ],
                            )
                          : ListView.separated(
                              padding: const EdgeInsets.fromLTRB(
                                16,
                                16,
                                16,
                                24,
                              ),
                              physics: const AlwaysScrollableScrollPhysics(),
                              itemCount: _purchases.length,
                              separatorBuilder: (context, index) =>
                                  const SizedBox(height: 14),
                              itemBuilder: (context, index) {
                                final purchase = _asMap(_purchases[index]);
                                return _PurchaseCard(
                                  purchase: purchase,
                                  isDarkMode: _isDarkMode,
                                  textPrimary: _textPrimary,
                                  textSecondary: _textSecondary,
                                  border: _border,
                                  onTap: () => _showDetails(purchase),
                                  formatDate: _formatDate,
                                  formatValue: _formatValue,
                                );
                              },
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

class _PurchaseCard extends StatelessWidget {
  const _PurchaseCard({
    required this.purchase,
    required this.isDarkMode,
    required this.textPrimary,
    required this.textSecondary,
    required this.border,
    required this.onTap,
    required this.formatDate,
    required this.formatValue,
  });

  final Map<String, dynamic> purchase;
  final bool isDarkMode;
  final Color textPrimary;
  final Color textSecondary;
  final Color border;
  final VoidCallback onTap;
  final String Function(dynamic) formatDate;
  final String Function(dynamic) formatValue;

  @override
  Widget build(BuildContext context) {
    final invoice =
        purchase['id_factura'] ??
        purchase['factura'] ??
        purchase['invoice'] ??
        purchase['id'];
    final status = _formatPurchaseStatus(
      purchase['estado_factura'] ?? purchase['estado'] ?? purchase['status'],
    );
    final items =
        purchase['detalle'] ??
        purchase['detalles'] ??
        purchase['items'] ??
        purchase['productos'];
    final itemsCount = items is List ? items.length : 0;

    return Container(
      decoration: BoxDecoration(
        color: isDarkMode ? Colors.white.withValues(alpha: 0.05) : Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: border),
        boxShadow: [
          BoxShadow(
            color: (isDarkMode ? Colors.black : Colors.blue).withValues(
              alpha: isDarkMode ? 0.16 : 0.08,
            ),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(28),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(18),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF38BDF8), Color(0xFF2563EB)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: const Icon(
                      Icons.receipt_long_outlined,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Factura #${invoice?.toString() ?? 'N/D'}',
                          style: TextStyle(
                            color: textPrimary,
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          formatDate(
                            purchase['fecha_factura'] ??
                                purchase['created_at'] ??
                                purchase['fecha'] ??
                                purchase['date'],
                          ),
                          style: TextStyle(
                            color: textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _formatPurchaseStatus(
                            purchase['estado_factura'] ??
                                purchase['estado'] ??
                                purchase['status'],
                          ),
                          style: TextStyle(
                            color:
                                _formatPurchaseStatus(
                                      purchase['estado_factura'] ??
                                          purchase['estado'] ??
                                          purchase['status'],
                                    ) ==
                                    'Validado'
                                ? const Color(0xFF10B981)
                                : textSecondary,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, color: textSecondary),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _MiniChip(label: status, isDarkMode: isDarkMode),
                  _MiniChip(
                    label: '$itemsCount producto(s)',
                    isDarkMode: isDarkMode,
                  ),
                  _MiniChip(
                    label:
                        '\$${formatValue(purchase['total'] ?? purchase['monto_total'] ?? purchase['total_venta'])}',
                    isDarkMode: isDarkMode,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailChip extends StatelessWidget {
  const _DetailChip({
    required this.label,
    required this.value,
    required this.isDarkMode,
  });

  final String label;
  final String value;
  final bool isDarkMode;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDarkMode
            ? Colors.white.withValues(alpha: 0.06)
            : const Color(0xFFF8FBFF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDarkMode
              ? Colors.white.withValues(alpha: 0.08)
              : const Color(0xFFBFDBFE),
        ),
      ),
      child: Row(
        children: [
          Text(
            label,
            style: TextStyle(
              color: isDarkMode ? Colors.white70 : const Color(0xFF475569),
              fontWeight: FontWeight.w700,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              color: isDarkMode ? Colors.white : const Color(0xFF0F172A),
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  const _MiniChip({required this.label, required this.isDarkMode});

  final String label;
  final bool isDarkMode;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: isDarkMode
            ? Colors.white.withValues(alpha: 0.06)
            : const Color(0xFFE0F2FE),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isDarkMode ? Colors.white : const Color(0xFF0F172A),
          fontWeight: FontWeight.w700,
          fontSize: 12,
        ),
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
