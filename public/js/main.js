document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("expense-table-body");
  const chartCanvas = document.getElementById("expenseChart");
  const addForm = document.getElementById("add-expense-form");
  let expenseChart;

  async function loadExpenses() {
    const res = await fetch("/api/expenses");
    const expenses = await res.json();

    tableBody.innerHTML = "";

    if (!expenses || expenses.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No expenses yet!</td></tr>`;
      if (expenseChart) expenseChart.destroy();
      return;
    }

    // Build table rows
    expenses.forEach((exp, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${exp.title}</td>
        <td>${exp.category}</td>
        <td>${exp.amount}</td>
        <td>${new Date(exp.date).toLocaleDateString()}</td>
        <td><button class="btn btn-danger btn-sm" data-id="${exp._id}">Delete</button></td>
      `;
      tableBody.appendChild(tr);
    });

    // Delete expense
    tableBody.querySelectorAll(".btn-danger").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        if (confirm("Delete this expense?")) {
          await fetch(`/api/expenses/${id}`, { method: "DELETE" });
          loadExpenses();
        }
      });
    });

    // Chart Data
    const categories = {};
    expenses.forEach(exp => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    if (expenseChart) expenseChart.destroy(); // destroy previous chart
    expenseChart = new Chart(chartCanvas, {
      type: "pie",
      data: {
        labels: Object.keys(categories),
        datasets: [{
          data: Object.values(categories),
          backgroundColor: ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b", "#858796"]
        }]
      },
      options: {
        plugins: { legend: { position: "bottom" } }
      }
    });
  }

  // Add expense form submit
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(addForm);
    const data = Object.fromEntries(formData.entries());

    await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    addForm.reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
    modal.hide();

    loadExpenses(); // refresh table and chart
  });

  loadExpenses();
});
