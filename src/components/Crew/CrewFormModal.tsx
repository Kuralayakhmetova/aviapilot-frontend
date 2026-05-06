'use client';

import { useState, useEffect } from 'react';
import { crewApi, CrewMember, CrewCategory } from '@/lib/crew-api';
import { extractApiError } from '@/lib/crew-api';
import styles from './CrewFormModal.module.css';

interface Props {
  member?: CrewMember | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: { value: CrewCategory; label: string }[] = [
  { value: 'COMMANDER',        label: 'Командир воздушного судна' },
  { value: 'SECOND_PILOT',     label: 'Второй пилот' },
  { value: 'INSTRUCTOR',       label: 'Лётчик-инструктор' },
  { value: 'ENGINEER',         label: 'Бортинженер' },
  { value: 'TECHNICIAN',       label: 'Борттехник' },
  { value: 'MECHANIC',         label: 'Бортмеханик' },
  { value: 'FLIGHT_ATTENDANT', label: 'Бортпроводник' },
];

const RANKS = [
  'Лейтенант',
  'Старший лейтенант',
  'Капитан',
  'Майор',
  'Подполковник',
  'Полковник',
] as const;

type Rank = typeof RANKS[number] | '';

interface FormState {
  firstName:        string;
  lastName:         string;
  middleName:       string;
  email:            string;
  phone:            string;
  position:         string;
  category:         CrewCategory;
  rank:             Rank;
  isActive:         boolean;
  birthDate:        string;
  licenseExpiry:    string;
  totalFlightHours: number;
  acTypePrimary:    string;
}

const initialForm: FormState = {
  firstName:        '',
  lastName:         '',
  middleName:       '',
  email:            '',
  phone:            '',
  position:         '',
  category:         'COMMANDER',
  rank:             '',
  isActive:         true,
  birthDate:        '',
  licenseExpiry:    '',
  totalFlightHours: 0,
  acTypePrimary:    '',
};

export default function CrewFormModal({ member, onClose, onSaved }: Props) {
  const [form, setForm]       = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const isEdit = !!member;

  useEffect(() => {
    if (member) {
      setForm({
        firstName:        member.firstName        || '',
        lastName:         member.lastName         || '',
        middleName:       member.middleName       || '',
        email:            member.email            || '',
        phone:            member.phone            || '',
        position:         member.position         || '',
        category:         member.category         || 'COMMANDER',
        rank:             (RANKS as readonly string[]).includes(member.rank || '')
                            ? (member.rank as Rank)
                            : '',
        isActive:         member.isActive         ?? true,
        birthDate:        member.birthDate        || '',
        licenseExpiry:    member.licenseExpiry     || '',
        totalFlightHours: member.totalFlightHours || 0,
        acTypePrimary:    member.acTypePrimary     || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [member]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'Введите имя';
    if (!form.lastName.trim())  newErrors.lastName  = 'Введите фамилию';
    if (!form.email.trim()) {
      newErrors.email = 'Введите email';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Некорректный email';
    }
    if (!form.category) newErrors.category = 'Выберите категорию';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload: Partial<CrewMember> = {
        firstName:        form.firstName.trim(),
        lastName:         form.lastName.trim(),
        category:         form.category,
        isActive:         form.isActive,
        totalFlightHours: Number(form.totalFlightHours),
      };

      if (form.middleName.trim())    payload.middleName    = form.middleName.trim();
      if (form.email.trim())         payload.email         = form.email.trim();
      if (form.phone.trim())         payload.phone         = form.phone.trim();
      if (form.position.trim())      payload.position      = form.position.trim();
      if (form.rank)                 payload.rank          = form.rank;
      if (form.birthDate)            payload.birthDate     = form.birthDate;
      if (form.licenseExpiry)        payload.licenseExpiry = form.licenseExpiry;
      if (form.acTypePrimary.trim()) payload.acTypePrimary = form.acTypePrimary.trim();

      console.log('📤 Payload:', payload);

      if (isEdit && member) {
        await crewApi.update(member.id, payload);
      } else {
        await crewApi.create(payload);
      }

      onSaved();
      onClose();
    } catch (error: unknown) {
      const msg = extractApiError(error);
      setErrors({ submit: msg });
      console.error('❌ Submit error:', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>

        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEdit ? '✏️ Редактировать сотрудника' : '+ Добавить сотрудника'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {errors.submit && (
            <div className={styles.errorBanner}>{errors.submit}</div>
          )}

          {/* ── Личные данные ── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Личные данные</h3>
            <div className={styles.grid2}>

              <div className={styles.field}>
                <label className={styles.label}>Фамилия *</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                  placeholder="Иванов"
                />
                {errors.lastName && (
                  <span className={styles.error}>{errors.lastName}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Имя *</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                  placeholder="Иван"
                />
                {errors.firstName && (
                  <span className={styles.error}>{errors.firstName}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Отчество</label>
                <input
                  name="middleName"
                  value={form.middleName}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Иванович"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Email *</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="example@mail.com"
                />
                {errors.email && (
                  <span className={styles.error}>{errors.email}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Телефон</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="+7 (777) 000-00-00"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Дата рождения</label>
                <input
                  name="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

            </div>
          </div>

          {/* ── Профессиональные данные ── */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Профессиональные данные</h3>
            <div className={styles.grid2}>

              <div className={styles.field}>
                <label className={styles.label}>Категория *</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.category && (
                  <span className={styles.error}>{errors.category}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Должность</label>
                <input
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Командир экипажа"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Воинское звание</label>
                <select
                  name="rank"
                  value={form.rank}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">— Не указано —</option>
                  {RANKS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Статус</label>
                <select
                  name="isActive"
                  value={form.isActive ? 'true' : 'false'}
                  onChange={(e) =>
                    setForm(prev => ({ ...prev, isActive: e.target.value === 'true' }))
                  }
                  className={styles.select}
                >
                  <option value="true">Активен</option>
                  <option value="false">Неактивен</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Срок действия лицензии</label>
                <input
                  name="licenseExpiry"
                  type="date"
                  value={form.licenseExpiry}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Общий налёт (часов)</label>
                <input
                  name="totalFlightHours"
                  type="number"
                  min="0"
                  value={form.totalFlightHours}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="0"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Основной тип ВС</label>
                <input
                  name="acTypePrimary"
                  value={form.acTypePrimary}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Boeing 737, Airbus A320..."
                />
              </div>

            </div>
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={loading}
            >
              {loading ? '⟳ Сохранение...' : isEdit ? '✓ Сохранить' : '+ Добавить'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
