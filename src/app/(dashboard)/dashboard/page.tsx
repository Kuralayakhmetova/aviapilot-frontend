// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useAuth } from '@/lib/auth-context';  
import { 
  Plane, 
  Clock, 
  Users, 
  FileText,
  TrendingUp,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    { name: 'Всего полётов', value: '1,284', change: '+12%', icon: Plane, color: 'blue' },
    { name: 'Налёт часов', value: '3,456:30', change: '+8%', icon: Clock, color: 'green' },
    { name: 'Активный персонал', value: '48', change: '+2', icon: Users, color: 'purple' },
    { name: 'Журналов ведётся', value: '12', change: '0', icon: FileText, color: 'orange' },
  ];

  const recentFlights = [
    { date: '15.01.2025', aircraft: 'Ми-8Т', board: 'UP-MI861', hours: '02:30', route: 'База - Точка А' },
    { date: '14.01.2025', aircraft: 'Ми-8МТВ', board: 'UP-MI862', hours: '04:15', route: 'База - Месторождение' },
    { date: '14.01.2025', aircraft: 'EC145', board: 'UP-EC501', hours: '01:45', route: 'Санзадание' },
    { date: '13.01.2025', aircraft: 'Ми-8Т', board: 'UP-MI861', hours: '03:00', route: 'Грузоперевозка' },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; text: string }> = {
      blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', icon: 'text-green-600', text: 'text-green-600' },
      purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-600' },
    };
    return colors[color] || colors.blue;
  };

  return (
     <div className="p-6 space-y-6">
      {/* Приветствие */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">
          Добро пожаловать, {user?.firstName || 'Пользователь'}!
        </h1>
        <p className="mt-1 text-blue-100">
          Система учёта лётной документации • {new Date().toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const colors = getColorClasses(stat.color);
          return (
            <div key={stat.name} className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${colors.bg}`}>
                  <stat.icon className={`h-6 w-6 ${colors.icon}`} />
                </div>
                <span className={`text-sm font-medium ${colors.text} flex items-center gap-1`}>
                  <TrendingUp className="h-4 w-4" />
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.name}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Основной контент */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Последние полёты */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              Последние полёты
            </h2>
            <a href="/flights" className="text-sm text-blue-600 hover:text-blue-700">
              Все полёты →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Дата</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ВС</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Борт</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Налёт</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Маршрут</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentFlights.map((flight, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{flight.date}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{flight.aircraft}</td>
                    <td className="px-4 py-3 text-gray-600">{flight.board}</td>
                    <td className="px-4 py-3 font-mono text-green-600">{flight.hours}</td>
                    <td className="px-4 py-3 text-gray-600">{flight.route}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Ближайшие события */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              Ближайшие события
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Продление сертификата</p>
                  <p className="text-xs text-gray-500">UP-MI861 • через 5 дней</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Плановое ТО</p>
                  <p className="text-xs text-gray-500">UP-MI862 • 20.01.2025</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Медкомиссия</p>
                  <p className="text-xs text-gray-500">Иванов А.П. • 22.01.2025</p>
                </div>
              </div>
            </div>
          </div>

          {/* Быстрые действия */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
            <div className="space-y-2">
              <a href="/flights" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Plane className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Журнал полётов СБД</span>
              </a>
              <a href="/logbook" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Бортовой журнал</span>
              </a>
              <a href="/utp" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">УТП</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
