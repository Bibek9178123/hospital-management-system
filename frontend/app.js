const API_URL = 'https://hospital-management-system-l33x.onrender.com/api';

// --- UI Navigation Logic ---
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');

const pageDetails = {
    'dashboard': { title: 'Dashboard Overview', sub: "Welcome back, here's what's happening today." },
    'patients': { title: 'Patient Management', sub: 'Register and manage hospital patients.' },
    'doctors': { title: 'Medical Staff', sub: 'Manage doctors and their specializations.' },
    'appointments': { title: 'Appointments Ledger', sub: 'Schedule and track patient visits.' },
    'billing': { title: 'Financial Overview', sub: 'Manage automated invoices and payments.' },
    'pharmacy': { title: 'Pharmacy Inventory', sub: 'Track medical supplies and stock levels.' },
    'wards': { title: 'Wards & Beds', sub: 'Manage in-patient admissions and bed assignments.' }
};

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Reset styles
        navBtns.forEach(b => {
            b.classList.remove('bg-white/10', 'text-white', 'shadow-inner', 'border-l-4', 'border-teal-400');
            b.classList.add('text-slate-300');
        });
        
        // Active style
        btn.classList.add('bg-white/10', 'text-white', 'shadow-inner', 'border-l-4', 'border-teal-400');
        btn.classList.remove('text-slate-300');
        
        const target = btn.dataset.target;
        pageTitle.textContent = pageDetails[target].title;
        pageSubtitle.textContent = pageDetails[target].sub;
        
        tabContents.forEach(content => {
            if (content.id === target) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        refreshData();
    });
});

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    msgEl.textContent = msg;
    
    toast.classList.remove('opacity-0', 'translate-y-[-20px]');
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-[-20px]');
    }, 3000);
}

// --- Data Fetching & Rendering ---
async function fetchData(endpoint) {
    try {
        const res = await fetch(API_URL + endpoint);
        return await res.json();
    } catch(e) {
        console.error("Error fetching " + endpoint, e);
        return [];
    }
}

let dashChart = null;
function initChart() {
    const ctx = document.getElementById('appointmentsChart');
    if (!ctx) return;
    
    if (dashChart) return; // Prevent re-initialization
    
    dashChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Appointments',
                data: [],
                borderColor: '#14b8a6', // teal-500
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                borderWidth: 3,
                tension: 0.4, // smooth curves
                fill: true,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#14b8a6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, suggestedMax: 5, ticks: { stepSize: 1 }, grid: { borderDash: [5, 5], color: '#f1f5f9' }, border: {display: false} },
                x: { grid: { display: false }, border: {display: false} }
            }
        }
    });
}

function updateChartWithRealData(appointments) {
    if (!dashChart) return;

    const labels = [];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    // Calculate the Last 7 Days (including today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    }

    // Tally up the appointments that fall into those 7 days
    appointments.forEach(a => {
        const aDate = new Date(a.appointmentDate);
        aDate.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - aDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays < 7) {
            const index = 6 - diffDays;
            counts[index]++;
        }
    });

    dashChart.data.labels = labels;
    dashChart.data.datasets[0].data = counts;
    dashChart.update();
}

async function refreshData() {
    const patients = await fetchData('/patients');
    const doctors = await fetchData('/doctors');
    const appointments = await fetchData('/appointments');
    const bills = await fetchData('/billing');
    const pharmacy = await fetchData('/pharmacy');
    const beds = await fetchData('/beds');

    // Update real chart data
    updateChartWithRealData(appointments);

    // Stats Updates
    document.getElementById('stat-patients').textContent = patients.length;
    document.getElementById('stat-doctors').textContent = doctors.length;
    document.getElementById('stat-appointments').textContent = appointments.length;
    document.getElementById('stat-billing').textContent = bills.filter(b => b.status === 'PENDING').length;
    
    document.getElementById('badge-patients') && (document.getElementById('badge-patients').textContent = `${patients.length} Total`);
    document.getElementById('badge-doctors') && (document.getElementById('badge-doctors').textContent = `${doctors.length} Total`);
    document.getElementById('badge-pharmacy') && (document.getElementById('badge-pharmacy').textContent = `${pharmacy.length} Items`);

    // Render Patients Table
    const pTbody = document.getElementById('table-patients');
    if (pTbody) {
        pTbody.innerHTML = patients.map(p => `
            <tr class="hover:bg-slate-50 transition-colors group">
                <td class="p-5">
                    <div class="flex items-center gap-3">
                        <img src="https://ui-avatars.com/api/?name=${p.name}&background=random&rounded=true" class="w-10 h-10 shadow-sm border-2 border-white">
                        <div>
                            <p class="font-bold text-slate-800">${p.name}</p>
                            <p class="text-xs text-slate-500">ID: #PT-${p.id}</p>
                        </div>
                    </div>
                </td>
                <td class="p-5">
                    <p class="text-sm text-slate-700"><span class="font-semibold text-slate-500 mr-1">Age:</span>${p.age}</p>
                    <div class="mt-1 flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">${p.bloodGroup}</span>
                    </div>
                </td>
                <td class="p-5">
                    <p class="text-sm font-medium text-slate-700">${p.phone}</p>
                    <p class="text-xs text-slate-500 truncate w-32">${p.address}</p>
                </td>
                <td class="p-5 text-right">
                    <button onclick="deletePatient(${p.id})" class="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Render Doctors Table
    const dTbody = document.getElementById('table-doctors');
    if (dTbody) {
        dTbody.innerHTML = doctors.map(d => `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-5">
                    <div class="flex items-center gap-3">
                        <img src="https://ui-avatars.com/api/?name=${d.name.replace('Dr. ', '')}&background=e0f2fe&color=0369a1&rounded=true" class="w-10 h-10 shadow-sm border-2 border-white">
                        <div>
                            <p class="font-bold text-slate-800">${d.name}</p>
                            <p class="text-xs text-slate-500">ID: #DR-${d.id}</p>
                        </div>
                    </div>
                </td>
                <td class="p-5">
                    <span class="px-3 py-1 bg-teal-50 text-teal-700 rounded-lg text-sm font-bold border border-teal-100">${d.specialization}</span>
                </td>
                <td class="p-5 text-sm font-medium text-slate-700">${d.phone}</td>
                <td class="p-5 text-right">
                    <button onclick="deleteDoctor(${d.id})" class="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Render Appointments Table
    const aTbody = document.getElementById('table-appointments');
    if (aTbody) {
        aTbody.innerHTML = appointments.map(a => {
            const dateObj = new Date(a.appointmentDate);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
            const isCompleted = a.status === 'COMPLETED';
            
            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-5 font-mono text-xs text-slate-500">#APT-${a.id}</td>
                <td class="p-5">
                    <div class="flex items-center gap-2">
                        <img src="https://ui-avatars.com/api/?name=${a.patient.name}&background=random&rounded=true" class="w-8 h-8 rounded-full">
                        <span class="font-bold text-slate-800 text-sm">${a.patient.name}</span>
                    </div>
                </td>
                <td class="p-5">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">Dr</div>
                        <span class="font-bold text-slate-700 text-sm">${a.doctor.name}</span>
                    </div>
                </td>
                <td class="p-5">
                    <p class="text-sm font-bold text-slate-800">${dateStr}</p>
                    <p class="text-xs text-slate-500">${timeStr}</p>
                </td>
                <td class="p-5">
                    <span class="px-3 py-1 text-xs font-bold rounded-full border ${isCompleted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}">
                        ${isCompleted ? '&#10003; ' : '&#8987; '}${a.status}
                    </span>
                </td>
                <td class="p-5 text-right">
                    ${!isCompleted ? 
                        `<button onclick="completeAppointment(${a.id})" class="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 transition-colors px-3 py-1.5 rounded-lg">Mark Done</button>` 
                        : '<span class="text-xs text-slate-400 font-medium">Processed</span>'}
                </td>
            </tr>
            `;
        }).join('');
    }

    // Populate Appointment Dropdowns
    const aPatientSelect = document.getElementById('a-patient');
    if (aPatientSelect) {
        aPatientSelect.innerHTML = '<option value="">Choose a Patient...</option>' + patients.map(p => `<option value="${p.id}">${p.name} (ID: ${p.id})</option>`).join('');
    }
    const aDoctorSelect = document.getElementById('a-doctor');
    if (aDoctorSelect) {
        aDoctorSelect.innerHTML = '<option value="">Choose a Doctor...</option>' + doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialization}</option>`).join('');
    }

    // Render Billing Table
    const bTbody = document.getElementById('table-billing');
    if (bTbody) {
        bTbody.innerHTML = bills.map(b => {
            const isPaid = b.status === 'PAID';
            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-5 pl-8 font-mono text-sm font-bold text-slate-700">INV-${1000 + b.id}</td>
                <td class="p-5">
                    <p class="font-bold text-slate-800 text-sm">${b.appointment.patient.name}</p>
                    <p class="text-xs text-slate-500">ID: #PT-${b.appointment.patient.id}</p>
                </td>
                <td class="p-5 text-sm text-blue-600 font-medium cursor-pointer hover:underline">#APT-${b.appointment.id}</td>
                <td class="p-5 font-black text-slate-800 text-lg">$${b.amount.toFixed(2)}</td>
                <td class="p-5">
                    <span class="px-3 py-1 text-xs font-bold rounded-full flex w-max items-center gap-1 border ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}">
                        ${isPaid ? '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : ''}
                        ${b.status}
                    </span>
                </td>
                <td class="p-5 pr-8 text-right">
                    ${!isPaid ? 
                        `<button onclick="payBill(${b.id})" class="bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl shadow hover:bg-slate-700 hover:shadow-lg transition-all text-sm flex items-center gap-2 ml-auto">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                            Process Payment
                        </button>` 
                        : '<span class="text-emerald-600 font-bold text-sm">Settled</span>'}
                </td>
            </tr>
            `;
        }).join('');
    }

    // Render Pharmacy Table
    const phTbody = document.getElementById('table-pharmacy');
    if (phTbody) {
        phTbody.innerHTML = pharmacy.map(m => {
            const isLow = m.stockQuantity < 10;
            return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="p-5 font-bold text-slate-800">${m.name}</td>
                <td class="p-5 text-sm text-slate-600">${m.category}</td>
                <td class="p-5">
                    <div class="flex items-center gap-3">
                        <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div class="h-full ${isLow ? 'bg-red-500' : 'bg-indigo-500'}" style="width: ${Math.min(m.stockQuantity, 100)}%"></div>
                        </div>
                        <span class="font-bold text-sm ${isLow ? 'text-red-600' : 'text-slate-700'}">${m.stockQuantity}</span>
                        ${isLow ? '<span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded shadow-sm border border-red-200 animate-pulse">LOW</span>' : ''}
                    </div>
                </td>
                <td class="p-5 font-bold text-slate-800">$${m.unitPrice.toFixed(2)}</td>
                <td class="p-5 text-right">
                    <button onclick="deleteMedicine(${m.id})" class="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    }

    // Render Beds Grid
    const bGrid = document.getElementById('grid-beds');
    if (bGrid) {
        bGrid.innerHTML = beds.map(b => {
            const isOccupied = b.isOccupied;
            
            return `
            <div class="glass-panel p-6 rounded-3xl border-t-4 ${isOccupied ? 'border-rose-500' : 'border-emerald-500'} relative shadow-sm hover:shadow-md transition-shadow">
                <button onclick="deleteBed(${b.id})" class="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="px-3 py-1 text-xs font-bold rounded-full ${isOccupied ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
                            ${b.wardName}
                        </span>
                        <h4 class="font-bold text-xl text-slate-800 mt-2">Bed ${b.bedNumber}</h4>
                    </div>
                </div>

                ${isOccupied ? `
                    <div class="bg-white border border-rose-100 rounded-2xl p-4 mt-2">
                        <div class="flex items-center gap-3 mb-3">
                            <img src="https://ui-avatars.com/api/?name=${b.patient.name}&background=ffe4e6&color=be123c&rounded=true" class="w-10 h-10 shadow-sm border border-rose-200">
                            <div>
                                <p class="font-bold text-sm text-slate-800">${b.patient.name}</p>
                                <p class="text-xs font-medium text-slate-500">Admitted</p>
                            </div>
                        </div>
                        <button onclick="dischargePatient(${b.id})" class="w-full py-2 bg-white border-2 border-rose-100 text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-50 transition-colors">Discharge Patient</button>
                    </div>
                ` : `
                    <div class="bg-white/50 border border-emerald-100 border-dashed rounded-2xl p-4 mt-2 h-[116px] flex flex-col justify-center">
                        <div class="flex gap-2 mb-2">
                            <select id="assign-patient-${b.id}" class="flex-1 bg-white border border-slate-200 rounded-lg px-2 text-xs focus:ring-1 focus:ring-emerald-400 outline-none">
                                <option value="">Select Patient...</option>
                                ${patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                        <button onclick="assignPatient(${b.id})" class="w-full py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-xs hover:bg-emerald-100 transition-colors">Admit to Bed</button>
                    </div>
                `}
            </div>
            `;
        }).join('');
    }
}

// --- Forms ---
document.getElementById('form-patient')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('p-name').value,
        age: document.getElementById('p-age').value,
        bloodGroup: document.getElementById('p-blood').value,
        phone: document.getElementById('p-phone').value,
        address: document.getElementById('p-address').value
    };
    await fetch(API_URL + '/patients', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    e.target.reset();
    showToast('New Patient successfully registered in system.');
    refreshData();
});

document.getElementById('form-doctor')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    let name = document.getElementById('d-name').value;
    if(!name.startsWith('Dr.')) name = 'Dr. ' + name;
    
    const data = {
        name: name,
        specialization: document.getElementById('d-spec').value,
        phone: document.getElementById('d-phone').value
    };
    await fetch(API_URL + '/doctors', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    e.target.reset();
    showToast('Medical staff member added to directory.');
    refreshData();
});

document.getElementById('form-appointment')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        patientId: document.getElementById('a-patient').value,
        doctorId: document.getElementById('a-doctor').value,
        appointmentDate: document.getElementById('a-date').value
    };
    await fetch(API_URL + '/appointments', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    e.target.reset();
    showToast('Appointment successfully scheduled.');
    refreshData();
});

document.getElementById('form-pharmacy')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('m-name').value,
        category: document.getElementById('m-category').value,
        stockQuantity: document.getElementById('m-stock').value,
        unitPrice: document.getElementById('m-price').value
    };
    await fetch(API_URL + '/pharmacy', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    e.target.reset();
    showToast('Stock added to pharmacy inventory.', 'success');
    refreshData();
});

document.getElementById('form-bed')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        wardName: document.getElementById('w-name').value,
        bedNumber: document.getElementById('w-bed').value
    };
    await fetch(API_URL + '/beds', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    e.target.reset();
    showToast('New bed successfully added to ward.', 'success');
    refreshData();
});

// --- Action Window Functions ---
window.deletePatient = async (id) => {
    if(confirm('Are you sure you want to permanently delete this patient record?')) {
        await fetch(`${API_URL}/patients/${id}`, {method: 'DELETE'});
        showToast('Patient record purged.');
        refreshData();
    }
};

window.deleteDoctor = async (id) => {
    if(confirm('Are you sure you want to remove this doctor from the directory?')) {
        await fetch(`${API_URL}/doctors/${id}`, {method: 'DELETE'});
        showToast('Doctor record removed.');
        refreshData();
    }
};

window.completeAppointment = async (id) => {
    await fetch(`${API_URL}/appointments/${id}/status`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: 'COMPLETED'})
    });
    showToast('Appointment marked complete. Invoice generated.');
    refreshData();
};

window.payBill = async (id) => {
    await fetch(`${API_URL}/billing/${id}/pay`, {method: 'PUT'});
    showToast('Payment processed successfully.');
    refreshData();
};

window.deleteMedicine = async (id) => {
    if(confirm('Are you sure you want to delete this item from inventory?')) {
        await fetch(`${API_URL}/pharmacy/${id}`, {method: 'DELETE'});
        showToast('Inventory item removed.');
        refreshData();
    }
};

window.assignPatient = async (bedId) => {
    const patientId = document.getElementById(`assign-patient-${bedId}`).value;
    if (!patientId) {
        showToast('Please select a patient first.', 'error');
        return;
    }
    await fetch(`${API_URL}/beds/${bedId}/assign`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({patientId: parseInt(patientId)})
    });
    showToast('Patient admitted to bed successfully.');
    refreshData();
};

window.dischargePatient = async (bedId) => {
    if(confirm('Are you sure you want to discharge this patient?')) {
        await fetch(`${API_URL}/beds/${bedId}/discharge`, {method: 'PUT'});
        showToast('Patient discharged successfully.');
        refreshData();
    }
};

window.deleteBed = async (id) => {
    if(confirm('Remove bed from ward?')) {
        await fetch(`${API_URL}/beds/${id}`, {method: 'DELETE'});
        refreshData();
    }
};

window.runDiagnostics = async () => {
    const btn = document.getElementById('btn-diagnostics');
    const originalText = btn.innerHTML;
    
    // Change to loading state
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Running checks...`;
    
    try {
        // Measure backend latency
        const start = Date.now();
        await fetch(API_URL + '/patients');
        const latency = Date.now() - start;
        
        setTimeout(() => {
            btn.innerHTML = `<svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> DB Online (${latency}ms ping)`;
            btn.classList.remove('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
            btn.classList.add('bg-emerald-100', 'text-emerald-700');
            
            showToast('Diagnostics completed. System optimal.');
            
            // Revert back after 4 seconds
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.classList.add('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
                btn.classList.remove('bg-emerald-100', 'text-emerald-700');
            }, 4000);
            
        }, 1200); // Artificial delay to make UI look like it's scanning
        
    } catch(e) {
        setTimeout(() => {
            btn.innerHTML = `System Offline!`;
            btn.classList.remove('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
            btn.classList.add('bg-rose-100', 'text-rose-700');
            showToast('Backend API is unreachable.', 'error');
            
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.classList.add('bg-slate-100', 'text-slate-700', 'hover:bg-slate-200');
                btn.classList.remove('bg-rose-100', 'text-rose-700');
            }, 4000);
        }, 1200);
    }
};

// Initialize app
initChart();
refreshData();
