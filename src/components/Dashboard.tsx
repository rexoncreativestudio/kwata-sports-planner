// src/components/Dashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import type { Event, SlotInfo, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { supabase } from '../supabaseClient';
import DayView from './DayView';
import AnalyticsDashboard from './AnalyticsDashboard';
import ContentLibrary from './ContentLibrary';
import Settings from './Settings';
import UserIcon from './UserIcon';
import BulkScheduler from './BulkScheduler'; // Import the BulkScheduler
import styles from './Dashboard.module.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const toLocalISOString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// A component to render the badge
const BadgeEvent = ({ event }: { event: any }) => {
    if (!event.count) return null;
    return (
        <div style={{width: '100%', height: '100%', display: 'flex'}}>
            <div className={styles.eventCountBadge}>
                {event.count}
            </div>
        </div>
    );
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Event[]>([]);
  const [badgeEvents, setBadgeEvents] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'calendar' | 'analytics' | 'library' | 'settings'>('calendar');
  const [viewingDate, setViewingDate] = useState<Date | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<View>('month');
  const [userFullName, setUserFullName] = useState<string>('');
  const [showScheduler, setShowScheduler] = useState(false); // State for BulkScheduler modal

  const fetchTasks = useCallback(async () => {
    const { data: tasks, error } = await supabase.from('content_tasks').select('*');
    if (error) { console.error('Error fetching tasks:', error); return; }
    if (tasks) {
      const formattedEvents = tasks.map((task) => ({
        title: task.title,
        start: new Date(task.scheduled_date.replace(/-/g, '/')),
        end: new Date(task.scheduled_date.replace(/-/g, '/')),
      }));
      setTasks(formattedEvents);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (profile && profile.full_name) {
          setUserFullName(profile.full_name);
        }
      }
      fetchTasks();
    };
    fetchInitialData();
  }, [fetchTasks]);

  useEffect(() => {
    if (userFullName) {
      document.title = `${userFullName} | Kwata Sports Planner`;
    } else {
      document.title = 'Kwata Sports Planner';
    }
  }, [userFullName]);

  useEffect(() => {
    const counts: { [key: string]: number } = {};
    for (const event of tasks) {
      if (event.start) {
        const dateStr = toLocalISOString(event.start);
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    }
    const newBadgeEvents = Object.entries(counts).map(([date, count]) => ({
        start: new Date(date.replace(/-/g, '/')),
        end: new Date(date.replace(/-/g, '/')),
        allDay: true,
        title: `${count} tasks`,
        count: count,
    }));
    setBadgeEvents(newBadgeEvents);
  }, [tasks]);

  const handleSignOut = async () => { await supabase.auth.signOut(); };

  const dayPropGetter = useCallback((date: Date) => {
      const isToday = toLocalISOString(new Date()) === toLocalISOString(date);
      let className = '';
      if(isToday) {
        className = styles.todayCell;
      }
      return { className };
  }, []);

  const renderCurrentView = () => {
    if (viewingDate) {
      return <DayView date={viewingDate} onBack={() => setViewingDate(null)} onTaskUpdate={fetchTasks} />;
    }

    switch (activeView) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'library':
        return <ContentLibrary />;
      case 'settings':
        return <Settings />;
      case 'calendar':
      default:
        return (
          <div className={styles.calendarContainer}>
            <Calendar
              localizer={localizer}
              events={badgeEvents}
              style={{ flex: 1 }}
              selectable
              onSelectSlot={(slotInfo: SlotInfo) => setViewingDate(slotInfo.start)}
              view={calendarView}
              date={calendarDate}
              onView={(view) => setCalendarView(view)}
              onNavigate={(date) => setCalendarDate(date)}
              dayPropGetter={dayPropGetter}
              components={{
                event: BadgeEvent,
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Restore the BulkScheduler modal */}
      {showScheduler && <BulkScheduler onClose={() => setShowScheduler(false)} onScheduleComplete={fetchTasks} />}

      <header className={styles.dashboardHeader}>
        <h2 className={styles.dashboardTitle}>
          {viewingDate ? 'Daily Tasks' : 
            activeView === 'calendar' ? 'Content Calendar' :
            activeView === 'analytics' ? 'Analytics Dashboard' :
            activeView === 'library' ? 'Content Library' : 'Settings'}
        </h2>
        
        <div className={styles.actionsContainer}>
          <button onClick={() => { setViewingDate(null); setActiveView('calendar'); }} className={`${styles.button} ${activeView === 'calendar' && !viewingDate ? styles.primaryButton : styles.secondaryButton}`}>Calendar</button>
          <button onClick={() => { setViewingDate(null); setActiveView('analytics'); }} className={`${styles.button} ${activeView === 'analytics' && !viewingDate ? styles.primaryButton : styles.secondaryButton}`}>Analytics</button>
          <button onClick={() => { setViewingDate(null); setActiveView('library'); }} className={`${styles.button} ${activeView === 'library' && !viewingDate ? styles.primaryButton : styles.secondaryButton}`}>Library</button>
          
          <div className={styles.rightActions}>
             {/* Restore the "Bulk Add Ideas" button */}
            <button onClick={() => setShowScheduler(true)} className={`${styles.button} ${styles.primaryButton}`}>
                Bulk Add Ideas
            </button>
            <div className={styles.profileMenuContainer}>
              <button className={styles.profileButton}><UserIcon /></button>
              <div className={styles.profileDropdown}>
                <button onClick={() => { setViewingDate(null); setActiveView('settings'); }} className={styles.dropdownItem}>Settings</button>
                <button onClick={handleSignOut} className={styles.dropdownItem}>Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className={styles.subHeader}>
        <h3 className={styles.welcomeMessage}>
          Welcome, {userFullName || 'Content Creator'}!
        </h3>
      </div>

      <main>
        {renderCurrentView()}
      </main>
    </div>
  );
}
