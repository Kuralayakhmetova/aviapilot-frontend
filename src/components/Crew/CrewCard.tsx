'use client';

import type { CrewMember } from '@/lib/crew-api';
import styles from './CrewCard.module.css';

interface Props {
  member:   CrewMember;
  onEdit?:  (member: CrewMember) => void;  // ← опциональный
  onDelete?: (id: string) => void;          // ← опциональный
}

const CATEGORY_LABELS: Record<string, string> = {
  COMMANDER:        'Командир ВС',
  SECOND_PILOT:     'Второй пилот',
  INSTRUCTOR:       'Инструктор',
  ENGINEER:         'Бортинженер',
  TECHNICIAN:       'Бортовой техник',
  MECHANIC:         'Бортмеханик',
  FLIGHT_ATTENDANT: 'Бортпроводник',
};

export default function CrewCard({ member, onEdit, onDelete }: Props) {
  const statusLabel = member.isActive ? 'Активен' : 'Неактивен';
  const statusCls   = member.isActive ? styles.statusActive : styles.statusInactive;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.name}>
            {member.lastName} {member.firstName}
          </h3>
          <p className={styles.position}>{member.position || '—'}</p>
          <span className={styles.category}>
            {CATEGORY_LABELS[member.category] || member.category}
          </span>
        </div>
        <span className={`${styles.status} ${statusCls}`}>
          {statusLabel}
        </span>
      </div>

      <div className={styles.details}>
       
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Налёт:</span>
          <span className={styles.detailValue}>{member.totalFlightHours} ч</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Основной тип:</span>
          <span className={styles.detailValue}>{member.acTypePrimary || '—'}</span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Email:</span>
          <span className={styles.detailValue}>{member.email || '—'}</span>
        </div>
      </div>

      {/* ✅ Кнопки показываем только если переданы обработчики */}
      {(onEdit || onDelete) && (
        <div className={styles.actions}>
          {onEdit && (
            <button className={styles.editBtn} onClick={() => onEdit(member)}>
              ✏️ Редактировать
            </button>
          )}
          {onDelete && (
            <button
              className={styles.deleteBtn}
              onClick={() => {
                if (confirm(`Удалить ${member.lastName} ${member.firstName}?`)) {
                  onDelete(member.id);
                }
              }}
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
}