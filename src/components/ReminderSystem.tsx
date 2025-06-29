// src/components/ReminderSystem.tsx
import { useMemo } from 'react';
import type { Event } from 'react-big-calendar';
import styles from './ReminderSystem.module.css';

type ReminderSystemProps = {
  events: Event[];
};

export default function ReminderSystem({ events }: ReminderSystemProps) {
  const contentGaps = useMemo(() => {
    const gaps: string[] = [];
    const scheduledDates = new Set(
      events.map(event => {
        // Normalize date to a YYYY-MM-DD string to avoid timezone issues
        return event.start?.toISOString().split('T')[0];
      })
    );

    // Check the next 7 days for gaps
    for (let i = 0; i < 7; i++) {
      const dateToCheck = new Date();
      dateToCheck.setDate(dateToCheck.getDate() + i);
      
      // THE FIX: getDay() returns 0 for Sunday. We will ignore it.
      if (dateToCheck.getDay() === 0) {
        continue; // Skip Sunday
      }

      const dateString = dateToCheck.toISOString().split('T')[0];

      if (!scheduledDates.has(dateString)) {
        gaps.push(dateToCheck.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }));
      }
    }
    return gaps;
  }, [events]);

  if (contentGaps.length === 0) {
    return null;
  }

  return (
    <div className={styles.reminderContainer}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <h4 className={styles.title}>Content Gaps Detected!</h4>
        <p className={styles.message}>You have no content scheduled for the following upcoming dates:</p>
        <ul className={styles.gapList}>
          {contentGaps.map(gap => <li key={gap}>{gap}</li>)}
        </ul>
      </div>
    </div>
  );
}
