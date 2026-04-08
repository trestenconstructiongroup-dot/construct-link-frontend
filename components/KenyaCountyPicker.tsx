import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Text } from './Text';
import { KENYA_COUNTIES, getKenyaCountyName, type KenyaCountyOption } from '../constants/kenyaCounties';

type Props = {
  value: string;
  onChange: (slug: string) => void;
  placeholder?: string;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  surfaceColor: string;
  accentColor: string;
};

export function KenyaCountyPicker({
  value,
  onChange,
  placeholder = 'Select Kenya county',
  textColor,
  mutedColor,
  borderColor,
  surfaceColor,
  accentColor,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return [...KENYA_COUNTIES];
    return KENYA_COUNTIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.includes(q),
    );
  }, [filter]);

  const label = value ? getKenyaCountyName(value) : '';

  const renderItem = ({ item }: { item: KenyaCountyOption }) => (
    <Pressable
      style={[styles.row, { borderBottomColor: borderColor }]}
      onPress={() => {
        onChange(item.slug);
        setOpen(false);
        setFilter('');
      }}
    >
      <Text style={[styles.rowText, { color: textColor }]}>{item.name}</Text>
      {value === item.slug ? (
        <Ionicons name="checkmark-circle" size={20} color={accentColor} />
      ) : null}
    </Pressable>
  );

  return (
    <>
      <Pressable
        style={[styles.trigger, { borderColor, backgroundColor: surfaceColor }]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.triggerText, { color: value ? textColor : mutedColor }]}>
          {label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={mutedColor} />
      </Pressable>
      <Modal visible={open} animationType="slide" transparent>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: surfaceColor, borderColor }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.sheetTitle, { color: textColor }]}>Kenya county</Text>
            <TextInput
              style={[styles.search, { color: textColor, borderColor }]}
              placeholder="Search..."
              placeholderTextColor={mutedColor}
              value={filter}
              onChangeText={setFilter}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.slug}
              renderItem={renderItem}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            />
            <Pressable
              style={[styles.clearBtn, { borderColor }]}
              onPress={() => {
                onChange('');
                setOpen(false);
                setFilter('');
              }}
            >
              <Text style={{ color: mutedColor, fontSize: 14 }}>Clear selection</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  } as ViewStyle,
  triggerText: { fontSize: 15, flex: 1 } as TextStyle,
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  } as ViewStyle,
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingBottom: 24,
  } as ViewStyle,
  sheetTitle: { fontSize: 17, fontWeight: '600', padding: 16 } as TextStyle,
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  } as TextStyle,
  list: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  } as ViewStyle,
  rowText: { fontSize: 15, flex: 1 } as TextStyle,
  clearBtn: { alignSelf: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderRadius: 8 },
});
