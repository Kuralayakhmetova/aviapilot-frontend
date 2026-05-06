// app/(dashboard)/crew/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  apiFetchCrewMembers,
  apiDeleteCrewMember,
  type CrewMember,
  type CrewFilters,
  type CrewCategory,
} from '@/lib/crew-api';

import CrewCard      from '@/components/Crew/CrewCard';
import CrewFormModal from '@/components/Crew/CrewFormModal';
import styles        from './crew.module.css';
import { useRole }   from "@/hooks/useRole";

// ─── локальный тип фильтров UI ────────────────────────────────────────────
interface UiFilters {
  search:   string;
  category: CrewCategory | 'all';
  status:   'active' | 'inactive' | 'all';
  sortBy:   string;
  order:    'asc' | 'desc';
}

const DEFAULT_FILTERS: UiFilters = {
  search:   '',
  category: 'all',
  status:   'active',
  sortBy:   'lastName',
  order:    'asc',
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Неизвестная ошибка';
}

export default function CrewPage() {
  const [members, setMembers]       = useState<CrewMember[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editMember, setEditMember] = useState<CrewMember | null>(null);
  const [filters, setFilters]       = useState<UiFilters>(DEFAULT_FILTERS);
  const [localSearch, setLocalSearch] = useState('');

  // ✅ Роль пользователя
  const { isAdmin } = useRole();

  // ─── fetch ──────────────────────────────────────────────────────────────
  const fetchCrew = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const apiFilters: CrewFilters = {
        search:   filters.search   || undefined,
        category: filters.category === 'all' ? undefined : filters.category,
        status:   filters.status   === 'all' ? undefined : filters.status,
      };

      const data = await apiFetchCrewMembers(
        apiFilters,
        filters.sortBy as never,
        filters.order,
      );

      setMembers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCrew(); }, [fetchCrew]);

  // ─── handlers ───────────────────────────────────────────────────────────
  const handleFilterChange = <K extends keyof UiFilters>(
    key: K,
    value: UiFilters[K],
  ) => setFilters(prev => ({ ...prev, [key]: value }));

  const handleSearchSubmit = () =>
    setFilters(prev => ({ ...prev, search: localSearch }));

  const handleReset = () => {
    setLocalSearch('');
    setFilters(DEFAULT_FILTERS);
  };

  const handleAddClick  = () => { setEditMember(null); setShowModal(true); };
  const handleEditClick = (m: CrewMember) => { setEditMember(m); setShowModal(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить сотрудника?')) return;
    try {
      await apiDeleteCrewMember(id);
      await fetchCrew();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleModalClose = () => { setShowModal(false); setEditMember(null); };
  const handleSaved      = () => { fetchCrew(); };

  // ─── render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Лётный состав</h1>
          <p className={styles.pageSubtitle}>
            Всего сотрудников: <strong>{members.length}</strong>
          </p>
        </div>

        {/* ✅ Кнопка добавления — только для admin */}
        {isAdmin && (
          <button className={styles.addBtn} onClick={handleAddClick}>
            + Добавить сотрудника
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className={styles.filtersCard}>
        <div className={styles.searchRow}>
          <label className={styles.filterLabel}>Поиск</label>
          <input
            className={styles.searchInput}
            placeholder="Поиск по имени, фамилии, email..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Категория</label>
            <select
              className={styles.filterSelect}
              value={filters.category}
              onChange={e =>
                handleFilterChange('category', e.target.value as UiFilters['category'])
              }
            >
              <option value="all">Все категории</option>
              <option value="COMMANDER">КВС</option>
              <option value="SECOND_PILOT">Второй пилот</option>
              <option value="INSTRUCTOR">Инструктор</option>
              <option value="ENGINEER">Инженер</option>
              <option value="TECHNICIAN">Борттехник</option>
              <option value="MECHANIC">Бортмеханик</option>
              <option value="FLIGHT_ATTENDANT">Бортпроводник</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Статус</label>
            <select
              className={styles.filterSelect}
              value={filters.status}
              onChange={e =>
                handleFilterChange('status', e.target.value as UiFilters['status'])
              }
            >
              <option value="all">Все статусы</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Сортировка</label>
            <select
              className={styles.filterSelect}
              value={filters.sortBy}
              onChange={e => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="lastName">Фамилия</option>
              <option value="firstName">Имя</option>
              <option value="totalFlightHours">Налёт</option>
              <option value="hireDate">Дата найма</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Порядок</label>
            <select
              className={styles.filterSelect}
              value={filters.order}
              onChange={e =>
                handleFilterChange('order', e.target.value as 'asc' | 'desc')
              }
            >
              <option value="asc">Возрастание</option>
              <option value="desc">Убывание</option>
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Сбросить
          </button>
          <button className={styles.applyBtn} onClick={handleSearchSubmit}>
            Обновить
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorState}>
          ⚠️ {error}
          <button onClick={fetchCrew} className={styles.retryBtn}>
            Повторить
          </button>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Загрузка данных...</span>
        </div>
      ) : members.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>👥</span>
          <p>Сотрудники не найдены</p>
          {/* ✅ Кнопка в пустом состоянии — только для admin */}
          {isAdmin && (
            <button className={styles.addBtn} onClick={handleAddClick}>
              + Добавить первого сотрудника
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {members.map(member => (
            <CrewCard
              key={member.id}
              member={member}
              // ✅ Кнопки редактирования/удаления — только для admin
              onEdit={isAdmin ? handleEditClick : undefined}
              onDelete={isAdmin ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      {/* ── Modal — только для admin ── */}
      {showModal && isAdmin && (
        <CrewFormModal
          member={editMember}
          onClose={handleModalClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
