type ObjectListRow = {
  idx: number;
  label: string;
  dimension: number;
  visible: boolean;
};

type ObjectListControllerOptions = {
  getRows: () => ObjectListRow[];
  getSelectedIndex: () => number;
  onSelect: (idx: number) => void;
  onToggleVisibility: (idx: number, visible: boolean) => void;
  onRename: (idx: number, value: string) => void;
  onAfterUpdate?: () => void;
};

function eyeIcon(visible: boolean) {
  return `<span class="material-symbols-rounded" aria-hidden="true">${visible ? 'visibility' : 'visibility_off'}</span>`;
}

export class ObjectListController {
  private readonly listEl = document.getElementById('object-list') as HTMLDivElement | null;

  constructor(private readonly options: ObjectListControllerOptions) {}

  update() {
    if (!this.listEl) return;

    const rows = this.options.getRows();
    this.listEl.textContent = '';

    const title = document.createElement('h4');
    title.textContent = 'Objects';
    this.listEl.appendChild(title);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th aria-label="Visibility"></th><th aria-label="Object name"></th><th aria-label="Object dimension"></th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.className = `object-row${row.idx === this.options.getSelectedIndex() ? ' active' : ''}${row.visible ? '' : ' hidden'}`;
      tr.addEventListener('click', () => this.options.onSelect(row.idx));

      const visibilityCell = document.createElement('td');
      const visibilityButton = document.createElement('button');
      visibilityButton.className = 'object-eye';
      visibilityButton.type = 'button';
      visibilityButton.title = row.visible ? 'Hide object' : 'Show object';
      visibilityButton.setAttribute('aria-label', row.visible ? `Hide ${row.label}` : `Show ${row.label}`);
      visibilityButton.innerHTML = eyeIcon(row.visible);
      visibilityButton.addEventListener('click', ev => {
        ev.stopPropagation();
        this.options.onToggleVisibility(row.idx, !row.visible);
      });
      visibilityCell.appendChild(visibilityButton);

      const nameCell = document.createElement('td');
      const nameInput = document.createElement('input');
      nameInput.className = 'object-name';
      nameInput.value = row.label;
      nameInput.title = 'Rename object';
      nameInput.addEventListener('click', ev => ev.stopPropagation());
      nameInput.addEventListener('keydown', ev => {
        ev.stopPropagation();
        if (ev.key === 'Enter') {
          ev.preventDefault();
          nameInput.blur();
        } else if (ev.key === 'Escape') {
          nameInput.value = row.label;
          nameInput.blur();
        }
      });
      nameInput.addEventListener('blur', () => this.options.onRename(row.idx, nameInput.value));
      nameCell.appendChild(nameInput);

      const dimensionCell = document.createElement('td');
      dimensionCell.textContent = `${row.dimension}`;

      tr.append(visibilityCell, nameCell, dimensionCell);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    this.listEl.appendChild(table);
    this.options.onAfterUpdate?.();
  }
}
