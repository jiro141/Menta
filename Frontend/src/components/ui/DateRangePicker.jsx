import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown } from "lucide-react";

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Cerrar el dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  };

  const isInRange = (date) => {
    if (!date || !startDate || !endDate) return false;
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const handleDateClick = (date) => {
    if (!date) return;
    
    const dateStr = formatDate(date);
    
    if (selectingStart) {
      onStartDateChange(dateStr);
      onEndDateChange("");
      setSelectingStart(false);
    } else {
      if (startDate && dateStr < startDate) {
        onEndDateChange(startDate);
        onStartDateChange(dateStr);
      } else {
        onEndDateChange(dateStr);
      }
      setSelectingStart(true);
    }
  };

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const days = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon size={18} className="text-slate-400" />
          <div className="text-left">
            {startDate || endDate ? (
              <div className="text-sm text-white">
                {startDate && endDate 
                  ? `${new Date(startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${new Date(endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                  : startDate 
                    ? `Desde: ${new Date(startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                    : `Hasta: ${new Date(endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                }
              </div>
            ) : (
              <span className="text-sm text-slate-500">Seleccionar fechas...</span>
            )}
          </div>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown flotante */}
      {isExpanded && (
        <div className="absolute z-[100] mt-2 w-full min-w-[320px]">
          <div className="bg-[#1a1d29] rounded-xl border border-white/10 shadow-xl p-4 space-y-3">
            {/* Indicador */}
            <div className="flex items-center gap-2 text-xs">
              <span className={selectingStart ? "text-emerald-400" : "text-slate-500"}>
                {selectingStart ? "● Seleccionando inicio" : "● Seleccionando fin"}
              </span>
              {startDate && !endDate && (
                <button 
                  type="button"
                  onClick={() => setSelectingStart(true)}
                  className="text-slate-400 hover:text-white underline"
                >
                  (cambiar)
                </button>
              )}
            </div>

            {/* Header del calendario */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs text-slate-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={!date}
                  onClick={() => handleDateClick(date)}
                  className={`
                    w-8 h-8 text-xs rounded-lg transition flex items-center justify-center
                    ${!date ? "invisible" : ""}
                    ${isSameDay(date, startDate) ? "bg-emerald-500 text-white font-medium" : ""}
                    ${isSameDay(date, endDate) ? "bg-emerald-500 text-white font-medium" : ""}
                    ${isInRange(date) && !isSameDay(date, startDate) && !isSameDay(date, endDate) ? "bg-emerald-500/30 text-white" : ""}
                    ${!isSameDay(date, startDate) && !isSameDay(date, endDate) && !isInRange(date) ? "text-white/70 hover:bg-white/10" : ""}
                    ${isToday(date) ? "ring-1 ring-white/30" : ""}
                  `}
                >
                  {date?.getDate()}
                </button>
              ))}
            </div>

            {/* Botones rápidos */}
            <div className="flex gap-2 flex-wrap pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const dateStr = today.toISOString().split('T')[0];
                  onStartDateChange(dateStr);
                  setSelectingStart(false);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const nextWeek = new Date(today);
                  nextWeek.setDate(today.getDate() + 7);
                  onStartDateChange(today.toISOString().split('T')[0]);
                  onEndDateChange(nextWeek.toISOString().split('T')[0]);
                  setSelectingStart(true);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
              >
                Esta semana
              </button>
              <button
                type="button"
                onClick={() => {
                  onStartDateChange("");
                  onEndDateChange("");
                  setSelectingStart(true);
                }}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
