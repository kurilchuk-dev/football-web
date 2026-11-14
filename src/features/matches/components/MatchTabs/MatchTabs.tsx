import styles from './MatchTabs.module.css';

export interface MatchTab<Id extends string> {
  id: Id;
  label: string;
  count: number;
}

interface MatchTabsProps<Id extends string> {
  tabs: MatchTab<Id>[];
  active: Id;
  onChange: (id: Id) => void;
}

/** Segmented control: full width on phones, compact on desktop. */
export function MatchTabs<Id extends string>({ tabs, active, onChange }: MatchTabsProps<Id>) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={selected ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            <span className={styles.count}>{tab.count}</span>
          </button>
        );
      })}
    </div>
  );
}
