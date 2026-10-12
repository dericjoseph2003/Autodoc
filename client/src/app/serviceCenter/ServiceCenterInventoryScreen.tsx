import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import BackButton from '../../components/ui/BackButton';

const THEME = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
  primary: '#0046AD',
  primaryLight: '#EEF2FF',
  primaryBorder: '#C7D2FE',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  accent: '#6366F1'
};

const CATEGORIES = [
  'All',
  'Tyres',
  'Tubes',
  'Batteries',
  'Brake Parts',
  'Engine Oil',
  'Filters',
  'Wiper Blades',
  'Wheel Alignment',
  'Accessories',
  'Other'
];

const UNITS = ['piece', 'set', 'litre', 'pair'];

export default function ServiceCenterInventoryScreen({ onBack, user }: { onBack: () => void; user?: any }) {
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tyres');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('piece');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [reorderLevel, setReorderLevel] = useState('5');
  const [compatibleVehicles, setCompatibleVehicles] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');

  const scId = user?.serviceCenter?._id || user?.serviceCenterId || user?.service_center_id || user?._id || user?.id;

  const fetchParts = async () => {
    try {
      setLoading(true);
      const res = await api.listParts(scId ? { serviceCenter: scId } : undefined);
      const list = res.data || res.parts || res.spareParts || [];

      // Ensure every part has a unique id and show unique parts only
      const uniqueMap = new Map();
      for (const p of list) {
        const pId = p.id || p._id || p.sku;
        if (pId && !uniqueMap.has(pId)) {
          uniqueMap.set(pId, {
            ...p,
            id: pId,
            _id: p._id || pId
          });
        }
      }
      setParts(Array.from(uniqueMap.values()));
    } catch (err) {
      console.error('Failed to load parts catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [scId]);

  const openAddModal = () => {
    setEditingPartId(null);
    setSku('');
    setName('');
    setCategory('Tyres');
    setBrand('');
    setUnit('piece');
    setCostPrice('');
    setSellingPrice('');
    setStockQuantity('10');
    setReorderLevel('5');
    setCompatibleVehicles('');
    setSupplierName('');
    setSupplierContact('');
    setShowModal(true);
  };

  const openEditModal = (part: any) => {
    setEditingPartId(part._id || part.id);
    setSku(part.sku || '');
    setName(part.name || part.spare_part_name || '');
    setCategory(part.category || part.spare_part_category || 'Other');
    setBrand(part.brand || part.spare_part_type || '');
    setUnit(part.unit || 'piece');
    setCostPrice(part.costPrice ? String(part.costPrice) : '');
    setSellingPrice(part.sellingPrice ? String(part.sellingPrice) : (part.spare_part_price ? String(part.spare_part_price) : ''));
    setStockQuantity(part.stockQuantity !== undefined ? String(part.stockQuantity) : (part.stock !== undefined ? String(part.stock) : '0'));
    setReorderLevel(part.reorderLevel !== undefined ? String(part.reorderLevel) : '5');
    setCompatibleVehicles(
      Array.isArray(part.compatibleVehicles)
        ? part.compatibleVehicles.join(', ')
        : (part.spare_part_vehicle_compatibility || '')
    );
    setSupplierName(part.supplier?.name || '');
    setSupplierContact(part.supplier?.contact || '');
    setShowModal(true);
  };

  const handleSavePart = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter part name');
      return;
    }
    if (!sellingPrice.trim() || isNaN(Number(sellingPrice))) {
      Alert.alert('Required Field', 'Please enter a valid selling price');
      return;
    }

    try {
      setSaving(true);
      const vehicleArray = compatibleVehicles
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        sku: sku.trim().toUpperCase() || undefined,
        name: name.trim(),
        category,
        brand: brand.trim() || 'Generic',
        unit,
        costPrice: parseFloat(costPrice) || Math.round((parseFloat(sellingPrice) || 0) * 0.8),
        sellingPrice: parseFloat(sellingPrice) || 0,
        stockQuantity: parseInt(stockQuantity) || 0,
        reorderLevel: parseInt(reorderLevel) || 5,
        compatibleVehicles: vehicleArray,
        serviceCenter: scId || undefined,
        supplier: {
          name: supplierName.trim(),
          contact: supplierContact.trim()
        }
      };

      if (editingPartId) {
        const res = await api.updatePart(editingPartId, payload);
        const updated = res.data || res.part || res.sparePart;
        const formattedUpdated = {
          ...updated,
          id: updated.id || updated._id || editingPartId,
          _id: updated._id || editingPartId
        };
        setParts(prev => {
          const map = new Map(prev.map(p => [p.id || p._id, p]));
          map.set(editingPartId, { ...map.get(editingPartId), ...formattedUpdated });
          return Array.from(map.values());
        });
        Alert.alert('Updated', 'Part updated successfully!');
      } else {
        const res = await api.createPart(payload);
        const created = res.data || res.part || res.sparePart;
        const createdId = created.id || created._id || `part-${Date.now()}`;
        const formattedCreated = {
          ...created,
          id: createdId,
          _id: created._id || createdId
        };
        setParts(prev => {
          const map = new Map();
          map.set(createdId, formattedCreated);
          for (const p of prev) {
            const pid = p.id || p._id;
            if (!map.has(pid)) map.set(pid, p);
          }
          return Array.from(map.values());
        });
        Alert.alert('Success', 'New part added to catalog!');
      }

      setShowModal(false);
    } catch (err: any) {
      console.error('Failed to save part:', err);
      Alert.alert('Error', err.message || 'Failed to save part');
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      const res = await api.adjustPartStock(id, delta);
      const updated = res.data || res.part || res.sparePart;
      setParts(prev =>
        prev.map(p => {
          if (p._id === id || p.id === id) {
            const currentQty = p.stockQuantity !== undefined ? p.stockQuantity : (p.stock || 0);
            const newQty = updated ? (updated.stockQuantity ?? updated.stock) : Math.max(0, currentQty + delta);
            return {
              ...p,
              stockQuantity: newQty,
              stock: newQty,
              spare_part_availability_status: newQty > 0 ? 'in_stock' : 'out_of_stock'
            };
          }
          return p;
        })
      );
    } catch (err: any) {
      console.error('Failed to adjust stock:', err);
      Alert.alert('Error', err.message || 'Failed to update stock quantity');
    }
  };

  const handleDeletePart = (id: string, partName: string) => {
    Alert.alert(
      'Deactivate Part',
      `Are you sure you want to deactivate "${partName}" from catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePart(id);
              setParts(prev => prev.filter(p => (p._id || p.id) !== id));
            } catch (err: any) {
              console.error('Failed to delete part:', err);
              Alert.alert('Error', err.message || 'Failed to deactivate part');
            }
          }
        }
      ]
    );
  };

  // Filter & Search Logic
  const filteredParts = parts.filter(p => {
    const pName = (p.name || p.spare_part_name || '').toLowerCase();
    const pBrand = (p.brand || p.spare_part_type || '').toLowerCase();
    const pSku = (p.sku || '').toLowerCase();
    const pCat = p.category || p.spare_part_category || '';
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || pName.includes(q) || pBrand.includes(q) || pSku.includes(q);
    const matchesCat = selectedCategory === 'All' || pCat === selectedCategory;

    const qty = p.stockQuantity !== undefined ? p.stockQuantity : (p.stock || 0);
    const reorder = p.reorderLevel !== undefined ? p.reorderLevel : 5;
    const isLowStock = qty <= reorder;

    const matchesLowStock = !lowStockFilter || isLowStock;

    return matchesSearch && matchesCat && matchesLowStock;
  });

  // Calculate Metrics
  const totalItems = parts.length;
  const inStockCount = parts.filter(p => {
    const qty = p.stockQuantity !== undefined ? p.stockQuantity : (p.stock || 0);
    const reorder = p.reorderLevel !== undefined ? p.reorderLevel : 5;
    return qty > reorder;
  }).length;
  const lowStockCount = parts.filter(p => {
    const qty = p.stockQuantity !== undefined ? p.stockQuantity : (p.stock || 0);
    const reorder = p.reorderLevel !== undefined ? p.reorderLevel : 5;
    return qty <= reorder && qty > 0;
  }).length;
  const outOfStockCount = parts.filter(p => {
    const qty = p.stockQuantity !== undefined ? p.stockQuantity : (p.stock || 0);
    return qty === 0;
  }).length;

  const getCategoryIcon = (catName: string) => {
    switch (catName) {
      case 'Tyres':
        return 'disc-outline';
      case 'Tubes':
        return 'ellipse-outline';
      case 'Batteries':
        return 'battery-charging-outline';
      case 'Brake Parts':
        return 'shield-checkmark-outline';
      case 'Engine Oil':
        return 'water-outline';
      case 'Filters':
        return 'options-outline';
      case 'Wiper Blades':
        return 'umbrella-outline';
      case 'Wheel Alignment':
        return 'build-outline';
      case 'Accessories':
        return 'car-sport-outline';
      default:
        return 'construct-outline';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>

        {/* Top Navigation Header */}
        <View style={styles.headerRow}>
          <BackButton variant="card" label="Dashboard" onPress={onBack} />
          <Text style={styles.headerTitle}>Parts Catalog & Inventory</Text>
          <TouchableOpacity style={styles.addHeaderBtn} onPress={openAddModal}>
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.addHeaderBtnText}>Add Part</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Summary Dashboard */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalItems}</Text>
            <Text style={styles.statLabel}>Total Catalog</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: THEME.border }]}>
            <Text style={[styles.statVal, { color: THEME.success }]}>{inStockCount}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={[styles.statBox, { borderRightWidth: 1, borderColor: THEME.border }]}>
            <Text style={[styles.statVal, { color: THEME.warning }]}>{lowStockCount}</Text>
            <Text style={styles.statLabel}>Low Stock Alert</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: THEME.error }]}>{outOfStockCount}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>

        {/* Search & Low-Stock Quick Filter Bar */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by part name, brand, SKU..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.lowStockBtn, lowStockFilter && styles.lowStockBtnActive]}
            onPress={() => setLowStockFilter(!lowStockFilter)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={lowStockFilter ? 'alert-circle' : 'alert-circle-outline'}
              size={16}
              color={lowStockFilter ? '#FFFFFF' : THEME.warning}
            />
            <Text style={[styles.lowStockBtnText, lowStockFilter && styles.lowStockBtnTextActive]}>
              Low Stock ({lowStockCount + outOfStockCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Scroll Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Main List Rendering */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loaderText}>Loading spare parts catalog...</Text>
          </View>
        ) : filteredParts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Spare Parts Found</Text>
            <Text style={styles.emptySubtitle}>
              {lowStockFilter
                ? 'All inventory parts have healthy stock levels!'
                : 'No parts match your search or selected category.'}
            </Text>
            <TouchableOpacity style={styles.addEmptyBtn} onPress={openAddModal}>
              <Text style={styles.addEmptyBtnText}>+ Add New Spare Part</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredParts.map(part => {
            const partId = part._id || part.id;
            const qty = part.stockQuantity !== undefined ? part.stockQuantity : (part.stock || 0);
            const reorder = part.reorderLevel !== undefined ? part.reorderLevel : 5;
            const isOutOfStock = qty === 0;
            const isLowStock = qty > 0 && qty <= reorder;

            const sellingP = part.sellingPrice || part.spare_part_price || part.price || 0;
            const costP = part.costPrice || 0;

            const compatStr = Array.isArray(part.compatibleVehicles) && part.compatibleVehicles.length > 0
              ? part.compatibleVehicles.join(', ')
              : (part.spare_part_vehicle_compatibility || 'Universal');

            return (
              <View key={partId} style={styles.card}>
                
                {/* Card Top Banner */}
                <View style={styles.cardHeader}>
                  <View style={styles.partIconBox}>
                    <Ionicons name={getCategoryIcon(part.category)} size={20} color={THEME.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.partName}>{part.name || part.spare_part_name}</Text>
                      {part.sku ? (
                        <View style={styles.skuBadge}>
                          <Text style={styles.skuBadgeText}>{part.sku}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.partSubDetails}>
                      Brand: <Text style={{ fontWeight: '700', color: THEME.text }}>{part.brand || 'Generic'}</Text> • {part.category || 'General'}
                    </Text>
                  </View>

                  {/* Stock Status Badge */}
                  <View
                    style={[
                      styles.stockBadge,
                      isOutOfStock
                        ? styles.stockBadgeOut
                        : isLowStock
                        ? styles.stockBadgeLow
                        : styles.stockBadgeIn
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockBadgeText,
                        isOutOfStock
                          ? styles.stockTextOut
                          : isLowStock
                          ? styles.stockTextLow
                          : styles.stockTextIn
                      ]}
                    >
                      {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                    </Text>
                  </View>
                </View>

                {/* Part Metadata Grid */}
                <View style={styles.partMetaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Selling Price</Text>
                    <Text style={styles.priceVal}>₹{sellingP} <Text style={styles.unitText}>/ {part.unit || 'piece'}</Text></Text>
                  </View>

                  {costP > 0 ? (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Cost Price</Text>
                      <Text style={styles.costVal}>₹{costP}</Text>
                    </View>
                  ) : null}

                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Reorder Level</Text>
                    <Text style={styles.metaVal}>≤ {reorder} {part.unit || 'pcs'}</Text>
                  </View>
                </View>

                {/* Compatibility & Supplier Info */}
                <View style={styles.detailsBox}>
                  <Text style={styles.detailsLabel}>🚘 Compatibility: <Text style={styles.detailsVal}>{compatStr}</Text></Text>
                  {part.supplier?.name ? (
                    <Text style={styles.detailsLabel}>
                      🏢 Supplier: <Text style={styles.detailsVal}>{part.supplier.name} {part.supplier.contact ? `(${part.supplier.contact})` : ''}</Text>
                    </Text>
                  ) : null}
                </View>

                {/* Quick Stock Controls & Actions Footer */}
                <View style={styles.cardFooter}>
                  
                  {/* Quick Stock Adjuster */}
                  <View style={styles.stockControlRow}>
                    <Text style={styles.stockQtyLabel}>Stock Qty:</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleAdjustStock(partId, -1)}
                      disabled={qty === 0}
                    >
                      <Ionicons name="remove" size={14} color={qty === 0 ? '#94A3B8' : THEME.text} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyVal, (isLowStock || isOutOfStock) && { color: THEME.error }]}>
                      {qty}
                    </Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleAdjustStock(partId, 1)}
                    >
                      <Ionicons name="add" size={14} color={THEME.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Edit & Delete Action Buttons */}
                  <View style={styles.actionBtnGroup}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(part)}
                    >
                      <Ionicons name="create-outline" size={16} color={THEME.primary} />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeletePart(partId, part.name || part.spare_part_name)}
                    >
                      <Ionicons name="trash-outline" size={16} color={THEME.error} />
                    </TouchableOpacity>
                  </View>

                </View>
              </View>
            );
          })
        )}

      </ScrollView>

      {/* Add / Edit Part Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPartId ? 'Edit Inventory Part' : 'Add New Part to Catalog'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={true}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>SKU Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. TYR-MRF-155"
                    value={sku}
                    onChangeText={setSku}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1.5 }]}>
                  <Text style={styles.label}>Brand Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. MRF / Bosch / Castrol"
                    value={brand}
                    onChangeText={setBrand}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Part Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MRF ZLX 155/70 R13 Tyre"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.pillSmall, category === cat && styles.pillSmallActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[styles.pillSmallText, category === cat && styles.pillSmallTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Unit of Measurement</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {UNITS.map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitPill, unit === u && styles.unitPillActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitPillText, unit === u && styles.unitPillTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Cost Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2450"
                    keyboardType="numeric"
                    value={costPrice}
                    onChangeText={setCostPrice}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Selling Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2950"
                    keyboardType="numeric"
                    value={sellingPrice}
                    onChangeText={setSellingPrice}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Stock Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="18"
                    keyboardType="numeric"
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Reorder Alert Level</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    keyboardType="numeric"
                    value={reorderLevel}
                    onChangeText={setReorderLevel}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Compatible Vehicles (comma separated)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Maruti Swift, Hyundai i10, Tata Tiago"
                  value={compatibleVehicles}
                  onChangeText={setCompatibleVehicles}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Supplier Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. MRF Regional Hub"
                    value={supplierName}
                    onChangeText={setSupplierName}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Supplier Contact</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    value={supplierContact}
                    onChangeText={setSupplierContact}
                  />
                </View>
              </View>

            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSavePart} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveText}>
                    {editingPartId ? 'Save Changes' : 'Add to Catalog'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  addHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: THEME.card,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  statVal: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text
  },
  statLabel: {
    fontSize: 10,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  searchFilterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.text
  },
  lowStockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: THEME.warningLight,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  lowStockBtnActive: {
    backgroundColor: THEME.warning,
    borderColor: THEME.warning
  },
  lowStockBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E'
  },
  lowStockBtnTextActive: {
    color: '#FFFFFF'
  },
  filterScroll: {
    marginBottom: 16
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    marginRight: 8
  },
  filterPillActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  loaderBox: {
    alignItems: 'center',
    padding: 40,
    gap: 10
  },
  loaderText: {
    fontSize: 13,
    color: THEME.textSecondary
  },
  emptyCard: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 10
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    marginTop: 12
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16
  },
  addEmptyBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10
  },
  addEmptyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  partIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: THEME.primaryLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  partName: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.text
  },
  skuBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  skuBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569'
  },
  partSubDetails: {
    fontSize: 11,
    color: THEME.textSecondary,
    marginTop: 2
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  stockBadgeIn: {
    backgroundColor: THEME.successLight,
    borderColor: '#A7F3D0'
  },
  stockBadgeLow: {
    backgroundColor: THEME.warningLight,
    borderColor: '#FDE68A'
  },
  stockBadgeOut: {
    backgroundColor: THEME.errorLight,
    borderColor: '#FCA5A5'
  },
  stockBadgeText: {
    fontSize: 9,
    fontWeight: '800'
  },
  stockTextIn: {
    color: '#065F46'
  },
  stockTextLow: {
    color: '#92400E'
  },
  stockTextOut: {
    color: '#991B1B'
  },
  partMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  metaItem: {
    gap: 2
  },
  metaLabel: {
    fontSize: 10,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.primary
  },
  unitText: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.textSecondary
  },
  costVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B'
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text
  },
  detailsBox: {
    paddingVertical: 8,
    gap: 4
  },
  detailsLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  detailsVal: {
    color: THEME.text,
    fontWeight: '700'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  stockControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  stockQtyLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border
  },
  qtyVal: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.text,
    minWidth: 20,
    textAlign: 'center'
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.primary
  },
  deleteBtn: {
    padding: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: THEME.text
  },
  inputGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textSecondary,
    marginBottom: 4
  },
  input: {
    height: 42,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    fontSize: 13,
    color: THEME.text
  },
  pillSmall: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6
  },
  pillSmallActive: {
    backgroundColor: THEME.primary
  },
  pillSmallText: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  pillSmallTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  unitPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: THEME.border
  },
  unitPillActive: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primaryBorder
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    textTransform: 'capitalize'
  },
  unitPillTextActive: {
    color: THEME.primary,
    fontWeight: '800'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.textSecondary
  },
  modalSaveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  }
});
