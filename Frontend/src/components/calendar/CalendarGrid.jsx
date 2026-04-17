import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const startDate = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = addDays(startDate, i);
    return {
      date,
      key: date.toISOString().split('T')[0],
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

export default function CalendarGrid({ tasks, statuses, onTaskClick }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const goToPrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const days = getCalendarDays(currentYear, currentMonth);
  const weeks = [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21), days.slice(21, 28), days.slice(28, 35), days.slice(35, 42)];

  const isToday = (date) => date.toDateString() === today.toDateString();

  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const totalDays = Math.floor((monthEnd - monthStart) / (1000 * 60 * 60 * 24)) + 1;
  
  const statusMap = new Map();
  statuses.forEach(s => statusMap.set(String(s.id), s));

  // Obtener eventos del mes
  const monthEvents = tasks
    .filter(task => {
      if (!task.startDate || !task.endDate) return false;
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      return taskStart <= monthEnd && taskEnd >= monthStart;
    })
    .map(task => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      const taskStatus = statusMap.get(String(task.status));
      
      return {
        id: task.id,
        task,
        title: task.title,
        statusColor: taskStatus?.color || "#10b981",
        startDate: taskStart < monthStart ? monthStart : taskStart,
        endDate: taskEnd > monthEnd ? monthEnd : taskEnd,
      };
    });

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/5 rounded-xl p-2 sm:p-3">
        <div className="flex items-center gap-2">
          <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-white min-w-[100px] sm:min-w-[140px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition">
            <ChevronRight size={16} />
          </button>
        </div>
        <button onClick={goToToday} className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium transition">
          Hoy
        </button>
      </div>

      {/* Calendario */}
      <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-[#0c1018]">
        {/* Días */}
        <div className="grid grid-cols-7 bg-white/5">
          {weekDays.map((day) => (
            <div key={day} className="py-1 sm:py-2 text-center text-[10px] sm:text-xs font-medium text-white/50">
              {day}
            </div>
          ))}
        </div>

        {/* Semanas con eventos continuos */}
        <div className="divide-y divide-white/5">
          {weeks.map((week, weekIndex) => {
            const weekStart = week[0].date;
            const weekEnd = week[6].date;
            
            // Eventos que intersecan con esta semana
            const weekEvents = monthEvents.filter(event => 
              event.startDate <= weekEnd && event.endDate >= weekStart
            );

            return (
              <div key={weekIndex} className="grid grid-cols-7 relative min-h-[80px] sm:min-h-[100px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`p-0.5 sm:p-1 border-r border-white/5 last:border-r-0 flex flex-col ${
                      day.isCurrentMonth ? "bg-[#0c1018]" : "bg-[#080a10]"
                    }`}
                  >
                    <div className={`text-[10px] sm:text-xs w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                      day.isCurrentMonth ? "text-white/70" : "text-white/20"
                    } ${isToday(day.date) ? "bg-emerald-500 text-white font-semibold" : ""}`}>
                      {day.dayNumber}
                    </div>
                  </div>
                ))}
                
                {/* Barra de eventos continua */}
                <div className="absolute top-8 left-1 right-1 flex flex-col gap-1">
                  {weekEvents.map((event, idx) => {
                    // Calcular posición basada en la semana actual
                    const eventStartInWeek = event.startDate < weekStart ? weekStart : event.startDate;
                    const eventEndInWeek = event.endDate > weekEnd ? weekEnd : event.endDate;
                    
                    const startOffset = Math.floor((eventStartInWeek - weekStart) / (1000 * 60 * 60 * 24));
                    const duration = Math.floor((eventEndInWeek - eventStartInWeek) / (1000 * 60 * 60 * 24)) + 1;
                    
                    const leftPercent = (startOffset / 7) * 100;
                    const widthPercent = (duration / 7) * 100;
                    
                    return (
                      <div
                        key={`${event.id}-${weekIndex}`}
                        onClick={() => onTaskClick && onTaskClick(event.task)}
                        className="absolute h-5 px-1.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-80 transition flex items-center text-white"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          top: `${idx * 22}px`,
                          backgroundColor: event.statusColor,
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
