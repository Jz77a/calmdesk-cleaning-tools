(() => {
  document.querySelectorAll('[data-print-page]').forEach(button => {
    button.addEventListener('click', () => window.print());
  });

  const fields = [...document.querySelectorAll('[data-quote-input]')];
  if (!fields.length) return;

  const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const output = id => document.getElementById(id);
  const number = id => Math.max(0, Number(document.getElementById(id).value) || 0);

  function calculate() {
    const hours = number('hours');
    const laborRate = number('laborRate');
    const supplies = number('supplies');
    const travel = number('travel');
    const overheadRate = Math.min(100, number('overhead')) / 100;
    const margin = Math.min(80, number('margin')) / 100;

    const labor = hours * laborRate;
    const directCost = labor + supplies + travel;
    const overheadCost = directCost * overheadRate;
    const costFloor = directCost + overheadCost;
    const targetQuote = margin >= 1 ? costFloor : costFloor / (1 - margin);
    const profitBuffer = Math.max(0, targetQuote - costFloor);
    const revenuePerHour = hours ? targetQuote / hours : 0;

    output('targetQuote').textContent = money.format(targetQuote);
    output('laborCost').textContent = money.format(labor);
    output('costFloor').textContent = money.format(costFloor);
    output('profitBuffer').textContent = money.format(profitBuffer);
    output('revenuePerHour').textContent = money.format(revenuePerHour);

    const health = output('health');
    health.className = 'health';
    if (!hours || !laborRate) {
      health.classList.add('warning');
      health.textContent = 'Add realistic labor hours and an hourly labor target before using this estimate.';
    } else if (margin < 0.1) {
      health.classList.add('caution');
      health.textContent = 'Your target margin is under 10%. A delay, callback, or underestimated room could erase the buffer.';
    } else {
      health.textContent = `This estimate leaves about ${money.format(profitBuffer)} above the entered labor, supplies, travel, and overhead assumptions.`;
    }

    try {
      localStorage.setItem('calmdesk-free-quote', JSON.stringify({
        hours, laborRate, supplies, travel,
        overhead: number('overhead'), margin: number('margin')
      }));
    } catch (_) {}
  }

  function load(values) {
    Object.entries(values).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field) field.value = value;
    });
    calculate();
  }

  fields.forEach(field => field.addEventListener('input', calculate));
  document.querySelectorAll('[data-preset]').forEach(button => {
    button.addEventListener('click', () => load(JSON.parse(button.dataset.preset)));
  });

  try {
    const saved = JSON.parse(localStorage.getItem('calmdesk-free-quote') || 'null');
    if (saved) load(saved);
  } catch (_) {}

  calculate();
})();
