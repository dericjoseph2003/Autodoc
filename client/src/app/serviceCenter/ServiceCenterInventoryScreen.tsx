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
  errorLight: '#FEE2E2'
};

const CATEGORIES = [
  'All',
  'Engine & Transmission',
  'Brakes & Suspension',
  'Electrical & Battery',
  'Tyres & Wheels',
  'Bodywork & Filters',
  'Oils & Fluids'
];

export default function ServiceCenterInventoryScreen({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form Fields
  const [partName, setPartName] = useState('');
  const [partCategory, setPartCategory] = useState('Engine & Transmission');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('10');
  const [partCompatibility, setPartCompatibility] = useState('Universal / Multi-brand');
  const [partDescription, setPartDescription] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.listSpareParts();
      setParts(res.spareParts || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddPart = async () => {
    if (!partName.trim() || !partPrice.trim()) {
      Alert.alert('Required Fields', 'Please enter part name and price');
      return;
    }

    try {
      setAdding(true);
      const payload = {
        spare_part_name: partName.trim(),
        spare_part_category: partCategory,
        spare_part_price: parseFloat(partPrice) || 0,
        stock: parseInt(partStock) || 0,
        spare_part_availability_status: (parseInt(partStock) || 0) > 0 ? 'in_stock' : 'out_of_stock',
        spare_part_vehicle_compatibility: partCompatibility.trim() || 'Universal',
        description: partDescription.trim()
      };

      const res = await api.createSparePart(payload);
      if (res.success) {
        setParts(prev => [res.sparePart, ...prev]);
        setShowAddModal(false);
        setPartName('');
        setPartPrice('');
        setPartStock('10');
        setPartDescription('');
        Alert.alert('Success', 'Spare part added to inventory!');
      }
    } catch (err: any) {
      console.error('Failed to add part:', err);
      Alert.alert('Error', err.message || 'Failed to add spare part');
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePart = async (id: string) => {
    try {
      await api.deleteSparePart(id);
      setParts(prev => prev.filter(p => p._id !== id));
    } catch (err: any) {
      console.error('Failed to delete part:', err);
      Alert.alert('Error', err.message || 'Failed to delete part');
    }
  };

  const filteredParts = parts.filter(p => {
    const pName = p.spare_part_name || p.name || '';
    const pCat = p.spare_part_category || p.category || '';
    const matchesSearch = !searchQuery || pName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || pCat === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalItems = parts.length;
  const outOfStockCount = parts.filter(p => p.spare_part_availability_status === 'out_of_stock' || p.stock === 0).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>

        {/* Top Header */}
        <View style={styles.headerRow}>
          <BackButton variant="card" label="Dashboard" onPress={onBack} />
          <Text style={styles.headerTitle}>Inventory Manager</Text>
          <TouchableOpacity style={styles.addHeaderBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addHeaderBtnText}>Add Part</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Summary Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalItems}</Text>
            <Text style={styles.statLabel}>Total Catalog</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: THEME.border }]}>
            <Text style={[styles.statVal, { color: THEME.success }]}>{totalItems - outOfStockCount}</Text>
            <Text style={styles.statLabel}>In Stock</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: THEME.error }]}>{outOfStockCount}</Text>
            <Text style={styles.statLabel}>Out of Stock</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search spare parts by name..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Category Filters */}
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

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={styles.loaderText}>Loading spare parts catalog...</Text>
          </View>
        ) : filteredParts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Spare Parts Found</Text>
            <Text style={styles.emptySubtitle}>Add your first inventory part to start managing stock levels.</Text>
            <TouchableOpacity style={styles.addEmptyBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addEmptyBtnText}>+ Add New Spare Part</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredParts.map(part => {
            const isOutOfStock = part.spare_part_availability_status === 'out_of_stock' || part.stock === 0;

            return (
              <View key={part._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.partIconBox}>
                    <Ionicons name="construct-outline" size={20} color={THEME.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partName}>{part.spare_part_name || part.name}</Text>
                    <Text style={styles.partCat}>{part.spare_part_category || part.category || 'General'}</Text>
                  </View>
                  <View style={[styles.stockBadge, isOutOfStock ? styles.stockBadgeOut : styles.stockBadgeIn]}>
                    <Text style={[styles.stockBadgeText, isOutOfStock ? styles.stockTextOut : styles.stockTextIn]}>
                      {isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
                    </Text>
                  </View>
                </View>

                <View style={styles.partMetaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Price</Text>
                    <Text style={styles.priceVal}>₹{part.spare_part_price || part.price}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Compatibility</Text>
                    <Text style={styles.metaVal}>{part.spare_part_vehicle_compatibility || 'Universal'}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.partTypeLabel}>Type: {part.spare_part_type || 'OEM'}</Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeletePart(part._id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={THEME.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>

      {/* Add Part Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Spare Part to Inventory</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Part Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bosch Brake Pads / Mobil 1 Engine Oil"
                  value={partName}
                  onChangeText={setPartName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.pillSmall, partCategory === cat && styles.pillSmallActive]}
                      onPress={() => setPartCategory(cat)}
                    >
                      <Text style={[styles.pillSmallText, partCategory === cat && styles.pillSmallTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Unit Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1200"
                    keyboardType="numeric"
                    value={partPrice}
                    onChangeText={setPartPrice}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Stock Units</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    keyboardType="numeric"
                    value={partStock}
                    onChangeText={setPartStock}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vehicle Compatibility</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Maruti Suzuki Swift / All Sedans"
                  value={partCompatibility}
                  onChangeText={setPartCompatibility}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddPart} disabled={adding}>
                {adding ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Inventory Part</Text>
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
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text
  },
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
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
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    alignItems: 'center'
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text
  },
  statLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 12,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.text
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
    width: 36,
    height: 36,
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
  partCat: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
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
  stockBadgeOut: {
    backgroundColor: THEME.errorLight,
    borderColor: '#FCA5A5'
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  stockTextIn: {
    color: '#065F46'
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
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.primary
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10
  },
  partTypeLabel: {
    fontSize: 11,
    color: THEME.textSecondary,
    fontWeight: '600'
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
    maxWidth: 480,
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
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text
  },
  inputGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginBottom: 4
  },
  input: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    fontSize: 14,
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
