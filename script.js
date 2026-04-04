* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  background: #0f172a;
  color: #e5e7eb;
}

/* Header */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #020617;
  border-bottom: 1px solid #1f2937;
}

.top-bar h1 {
  font-size: 1.2rem;
  font-weight: 600;
}

.top-bar-right {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 0.9rem;
  color: #9ca3af;
}

#refresh-btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  cursor: pointer;
}

#refresh-btn:hover {
  background: #1f2937;
}

.container {
  padding: 16px 24px 32px;
}

/* Cards */
.cards {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.card {
  background: #020617;
  border-radius: 8px;
  padding: 10px 12px;
  border: 1px solid #1f2937;
}

.card h2 {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 4px;
}

.card-number {
  font-size: 1.4rem;
  font-weight: 600;
}

.card-issue {
  border-color: #b91c1c;
}

/* Charts row */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.chart-card {
  background: #020617;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #1f2937;
}

.chart-card h3 {
  font-size: 0.95rem;
  margin-bottom: 8px;
}

/* Bottom row: tables */
.flex-row {
  display: grid;
  grid-template-columns: 1.4fr 1.4fr;
  gap: 16px;
  margin-bottom: 20px;
}

.panel {
  background: #020617;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #1f2937;
}

.panel h3 {
  font-size: 0.95rem;
  margin-bottom: 8px;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

thead {
  background: #111827;
}

th, td {
  padding: 6px 8px;
  border-bottom: 1px solid #1f2937;
}

th {
  text-align: left;
  color: #9ca3af;
}

tbody tr:nth-child(even) {
  background: #020617;
}

tbody tr:nth-child(odd) {
  background: #020617;
}

tbody tr:hover {
  background: #111827;
}

/* Resolve button */
.resolve-btn {
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: 4px;
  border: 1px solid #16a34a;
  background: #022c22;
  color: #bbf7d0;
  cursor: pointer;
}

.resolve-btn:hover {
  background: #065f46;
}

/* Responsive */
@media (max-width: 1100px) {
  .cards {
    grid-template-columns: repeat(3, minmax(120px, 1fr));
  }
  .charts-row {
    grid-template-columns: 1fr;
  }
  .flex-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .cards {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
