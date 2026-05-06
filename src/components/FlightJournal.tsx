// src/components/FlightJournal.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Plus,
  Download,
  Upload,
  Trash2,
  Save,
  Printer,
  FileSpreadsheet,
  Calendar,
  Plane
} from 'lucide-react';

// Интерфейс записи полёта (соответствует вашему журналу)
interface FlightRecord {
  id: string;
  date: string;                    // Дата
  subdivision: string;             // Подразделение
  aircraftType: string;            // Тип ВС
  aircraftNumber: string;          // Бортовой номер
  flightTask: string;              // Полётное задание
  route: string;                   // Маршрут
  flightHours: string;             // Налёт часов (ЧЧ:ММ)
  landings: number;                // Посадки
  fuelUsed: number;                // Расход топлива (кг)
  commander: string;               // Командир ВС
  crewCount: number;               // Экипаж (чел)
  passengerCount: number;          // Пассажиры
  cargoWeight: number;             // Груз (кг)
  remarks: string;                 // Примечания
}

// Названия месяцев
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Пустая запись
const createEmptyRecord = (): FlightRecord => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().split('T')[0],
  subdivision: '',
  aircraftType: '',
  aircraftNumber: '',
  flightTask: '',
  route: '',
  flightHours: '00:00',
  landings: 0,
  fuelUsed: 0,
  commander: '',
  crewCount: 0,
  passengerCount: 0,
  cargoWeight: 0,
  remarks: ''
});

// Парсинг времени ЧЧ:ММ в минуты
const parseFlightTime = (time: string): number => {
  const match = time.match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return 0;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
};

// Форматирование минут в ЧЧ:ММ
const formatFlightTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Тип для данных по месяцам
type MonthlyData = {
  [key: number]: FlightRecord[];
};

export default function FlightJournal() {
  const [activeMonth, setActiveMonth] = useState<number>(new Date().getMonth());
  const [data, setData] = useState<MonthlyData>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка данных из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('flightJournalData2025');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error('Ошибка загрузки данных:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Сохранение в localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('flightJournalData2025', JSON.stringify(data));
    }
  }, [data, isLoading]);

  // Получить записи текущего месяца
  const currentRecords = data[activeMonth] || [];

  // Добавить новую запись
  const addRecord = () => {
    const newRecord = createEmptyRecord();
    // Устанавливаем дату на текущий месяц
    const date = new Date();
    date.setMonth(activeMonth);
    newRecord.date = date.toISOString().split('T')[0];
    
    setData(prev => ({
      ...prev,
      [activeMonth]: [...(prev[activeMonth] || []), newRecord]
    }));
    setEditingId(newRecord.id);
  };

  // Обновить запись
  const updateRecord = (id: string, field: keyof FlightRecord, value: string | number) => {
    setData(prev => ({
      ...prev,
      [activeMonth]: (prev[activeMonth] || []).map(record =>
        record.id === id ? { ...record, [field]: value } : record
      )
    }));
  };

  // Удалить запись
  const deleteRecord = (id: string) => {
    if (confirm('Удалить эту запись?')) {
      setData(prev => ({
        ...prev,
        [activeMonth]: (prev[activeMonth] || []).filter(record => record.id !== id)
      }));
    }
  };

  // Расчёт итогов
  const calculateTotals = (records: FlightRecord[]) => {
    let totalMinutes = 0;
    let totalLandings = 0;
    let totalFuel = 0;
    let totalCrew = 0;
    let totalPassengers = 0;
    let totalCargo = 0;

    records.forEach(record => {
      totalMinutes += parseFlightTime(record.flightHours);
      totalLandings += record.landings || 0;
      totalFuel += record.fuelUsed || 0;
      totalCrew += record.crewCount || 0;
      totalPassengers += record.passengerCount || 0;
      totalCargo += record.cargoWeight || 0;
    });

    return {
      flightHours: formatFlightTime(totalMinutes),
      landings: totalLandings,
      fuelUsed: totalFuel,
      crewCount: totalCrew,
      passengerCount: totalPassengers,
      cargoWeight: totalCargo,
      flightCount: records.length
    };
  };

  // Импорт из Excel
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const newData: MonthlyData = {};
        
        wb.SheetNames.forEach((sheetName, index) => {
          if (index < 12) {
            const ws = wb.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[];
            
            newData[index] = jsonData.map((row) => ({
              id: crypto.randomUUID(),
              date: String(row['Дата'] || ''),
              subdivision: String(row['Подразделение'] || ''),
              aircraftType: String(row['Тип ВС'] || ''),
              aircraftNumber: String(row['Борт №'] || ''),
              flightTask: String(row['Полётное задание'] || ''),
              route: String(row['Маршрут'] || ''),
              flightHours: String(row['Налёт'] || '00:00'),
              landings: Number(row['Посадки']) || 0,
              fuelUsed: Number(row['Топливо (кг)']) || 0,
              commander: String(row['Командир ВС'] || ''),
              crewCount: Number(row['Экипаж']) || 0,
              passengerCount: Number(row['Пассажиры']) || 0,
              cargoWeight: Number(row['Груз (кг)']) || 0,
              remarks: String(row['Примечания'] || '')
            }));
          }
        });
        
        setData(newData);
        alert('Данные успешно импортированы!');
      } catch (error) {
        console.error('Ошибка импорта:', error);
        alert('Ошибка при импорте файла');
      }
    };
    reader.readAsBinaryString(file);
    
    if (e.target) {
      e.target.value = '';
    }
  };

  // Экспорт в Excel (текущий месяц)
  const exportMonth = () => {
    const records = currentRecords;
    if (records.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    const exportData = records.map(record => ({
      'Дата': record.date,
      'Подразделение': record.subdivision,
      'Тип ВС': record.aircraftType,
      'Борт №': record.aircraftNumber,
      'Полётное задание': record.flightTask,
      'Маршрут': record.route,
      'Налёт': record.flightHours,
      'Посадки': record.landings,
      'Топливо (кг)': record.fuelUsed,
      'Командир ВС': record.commander,
      'Экипаж': record.crewCount,
      'Пассажиры': record.passengerCount,
      'Груз (кг)': record.cargoWeight,
      'Примечания': record.remarks
    }));

    const totals = calculateTotals(records);
    exportData.push({
      'Дата': 'ИТОГО:',
      'Подразделение': '',
      'Тип ВС': '',
      'Борт №': '',
      'Полётное задание': `Полётов: ${totals.flightCount}`,
      'Маршрут': '',
      'Налёт': totals.flightHours,
      'Посадки': totals.landings,
      'Топливо (кг)': totals.fuelUsed,
      'Командир ВС': '',
      'Экипаж': totals.crewCount,
      'Пассажиры': totals.passengerCount,
      'Груз (кг)': totals.cargoWeight,
      'Примечания': ''
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, MONTHS[activeMonth]);
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, `СБД_${MONTHS[activeMonth]}_2025.xlsx`);
  };

  // Экспорт всего года
  const exportYear = () => {
    const wb = XLSX.utils.book_new();
    let hasData = false;

    MONTHS.forEach((monthName, index) => {
      const records = data[index] || [];
      if (records.length > 0) {
        hasData = true;
        const exportData = records.map(record => ({
          'Дата': record.date,
          'Подразделение': record.subdivision,
          'Тип ВС': record.aircraftType,
          'Борт №': record.aircraftNumber,
          'Полётное задание': record.flightTask,
          'Маршрут': record.route,
          'Налёт': record.flightHours,
          'Посадки': record.landings,
          'Топливо (кг)': record.fuelUsed,
          'Командир ВС': record.commander,
          'Экипаж': record.crewCount,
          'Пассажиры': record.passengerCount,
          'Груз (кг)': record.cargoWeight,
          'Примечания': record.remarks
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, monthName);
      }
    });

    if (!hasData) {
      alert('Нет данных для экспорта');
      return;
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, 'СБД_2025_Полный.xlsx');
  };

  // Печать
  const handlePrint = () => {
    window.print();
  };

  const totals = calculateTotals(currentRecords);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-2">
      {/* Заголовок */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Plane className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Журнал учёта полётов</h1>
            <p className="text-gray-500">СБД 2025</p>
          </div>
        </div>
        
        {/* Кнопки действий */}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Импорт
          </button>
          <button
            onClick={exportMonth}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Экспорт месяца
          </button>
          <button
            onClick={exportYear}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Экспорт года
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Printer className="h-4 w-4" />
            Печать
          </button>
        </div>
      </div>

      {/* Заголовок для печати */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">Журнал учёта полётов СБД 2025</h1>
        <p className="text-lg">{MONTHS[activeMonth]}</p>
      </div>

      {/* Табы месяцев */}
      <div className="flex flex-wrap gap-1 p-1 bg-gray-100 rounded-lg print:hidden">
        {MONTHS.map((month, index) => {
          const monthRecords = data[index] || [];
          const hasRecords = monthRecords.length > 0;
          
          return (
            <button
              key={month}
              onClick={() => setActiveMonth(index)}
              className={`
                flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${activeMonth === index
                  ? 'bg-green-600 text-white shadow-sm'
                  : hasRecords
                    ? 'bg-white text-green-700 hover:bg-green-50'
                    : 'text-gray-600 hover:bg-white'
                }
              `}
            >
              <Calendar className="h-3 w-3" />
              {month.slice(0, 3)}
              {hasRecords && (
                <span className={`
                  ml-1 px-1.5 py-0.5 text-xs rounded-full
                  ${activeMonth === index ? 'bg-green-500' : 'bg-green-100 text-green-700'}
                `}>
                  {monthRecords.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Карточки статистики */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Полётов</p>
          <p className="text-2xl font-bold text-gray-900">{totals.flightCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Налёт</p>
          <p className="text-2xl font-bold text-green-600">{totals.flightHours}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Посадки</p>
          <p className="text-2xl font-bold text-gray-900">{totals.landings}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Топливо (кг)</p>
          <p className="text-2xl font-bold text-gray-900">{totals.fuelUsed.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Экипаж</p>
          <p className="text-2xl font-bold text-gray-900">{totals.crewCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Пассажиры</p>
          <p className="text-2xl font-bold text-gray-900">{totals.passengerCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Груз (кг)</p>
          <p className="text-2xl font-bold text-gray-900">{totals.cargoWeight.toLocaleString()}</p>
        </div>
      </div>

      {/* Кнопка добавления */}
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-lg font-semibold text-gray-900">
          {MONTHS[activeMonth]} 2025
        </h2>
        <button
          onClick={addRecord}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Добавить полёт
        </button>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden print:border-black">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 print:bg-gray-200">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">№</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Дата</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Подразд.</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Тип ВС</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Борт №</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Задание</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Маршрут</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Налёт</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Посадки</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Топливо</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Командир</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Экипаж</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Пасс.</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b">Груз</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-900 border-b print:hidden">Действия</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-3 py-12 text-center text-gray-500">
                    <Plane className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Нет записей за {MONTHS[activeMonth]}</p>
                    <button
                      onClick={addRecord}
                      className="mt-3 text-green-600 hover:text-green-700 font-medium"
                    >
                      Добавить первый полёт
                    </button>
                  </td>
                </tr>
              ) : (
                currentRecords.map((record, index) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="date"
                          value={record.date}
                          onChange={(e) => updateRecord(record.id, 'date', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {new Date(record.date).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={record.subdivision}
                          onChange={(e) => updateRecord(record.id, 'subdivision', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Подразд."
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.subdivision || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={record.aircraftType}
                          onChange={(e) => updateRecord(record.id, 'aircraftType', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Ми-8"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer font-medium">
                          {record.aircraftType || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={record.aircraftNumber}
                          onChange={(e) => updateRecord(record.id, 'aircraftNumber', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="RA-12345"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.aircraftNumber || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={record.flightTask}
                          onChange={(e) => updateRecord(record.id, 'flightTask', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Задание"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.flightTask || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={record.route}
                          onChange={(e) => updateRecord(record.id, 'route', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Маршрут"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.route || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={record.flightHours}
                          onChange={(e) => updateRecord(record.id, 'flightHours', e.target.value)}
                          className="w-20 px-2 py-1 border rounded text-sm"
                          placeholder="00:00"
                          pattern="\d{1,3}:\d{2}"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer font-mono font-medium text-green-600">
                          {record.flightHours}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="number"
                          value={record.landings}
                          onChange={(e) => updateRecord(record.id, 'landings', parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border rounded text-sm"
                          min="0"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.landings}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="number"
                          value={record.fuelUsed}
                          onChange={(e) => updateRecord(record.id, 'fuelUsed', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-sm"
                          min="0"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.fuelUsed}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={record.commander}
                          onChange={(e) => updateRecord(record.id, 'commander', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="ФИО"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.commander || '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="number"
                          value={record.crewCount}
                          onChange={(e) => updateRecord(record.id, 'crewCount', parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 border rounded text-sm"
                          min="0"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.crewCount}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="number"
                          value={record.passengerCount}
                          onChange={(e) => updateRecord(record.id, 'passengerCount', parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 border rounded text-sm"
                          min="0"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.passengerCount}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {editingId === record.id ? (
                        <input
                          type="number"
                          value={record.cargoWeight}
                          onChange={(e) => updateRecord(record.id, 'cargoWeight', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-sm"
                          min="0"
                        />
                      ) : (
                        <span onClick={() => setEditingId(record.id)} className="cursor-pointer">
                          {record.cargoWeight}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 print:hidden">
                      <div className="flex gap-1">
                        {editingId === record.id ? (
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Сохранить"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
              
              {/* Строка итогов */}
              {currentRecords.length > 0 && (
                <tr className="bg-green-50 font-semibold">
                  <td className="px-3 py-3" colSpan={7}>
                    ИТОГО за {MONTHS[activeMonth]}: {totals.flightCount} полётов
                  </td>
                  <td className="px-3 py-3 text-green-700">{totals.flightHours}</td>
                  <td className="px-3 py-3">{totals.landings}</td>
                  <td className="px-3 py-3">{totals.fuelUsed.toLocaleString()}</td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3">{totals.crewCount}</td>
                  <td className="px-3 py-3">{totals.passengerCount}</td>
                  <td className="px-3 py-3">{totals.cargoWeight.toLocaleString()}</td>
                  <td className="px-3 py-3 print:hidden"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Стили для печати */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 1cm;
          }
          body {
            font-size: 10px;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          table {
            font-size: 9px;
          }
          th, td {
            padding: 4px 6px !important;
            border: 1px solid #000 !important;
          }
        }
      `}</style>
    </div>
  );
}
