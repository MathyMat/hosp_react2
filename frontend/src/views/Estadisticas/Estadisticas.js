import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CAlert,
  CBadge,
} from '@coreui/react';
import {
  CChartBar,
  CChartDoughnut,
  CChartLine,
  CChartPie,
} from '@coreui/react-chartjs';
import CIcon from '@coreui/icons-react';
import { getStyle } from '@coreui/utils';

// --- Import Relevant Icons ---
import {
    cilBasket, cilBed, cilCalendar, cilDollar, cilFrown,
    cilGraph, cilGroup, cilPeople, cilSpeedometer,
} from '@coreui/icons';

// --- Dynamic Dashboard Component ---
const MediAssistDynamicDashboard = () => {
  // --- State (Keep existing state hooks) ---
  const [patientDemographicsData, setPatientDemographicsData] = useState(null);
  const [consultationTrendsData, setConsultationTrendsData] = useState(null);
  const [appointmentStatusData, setAppointmentStatusData] = useState(null);
  const [inventoryLevelsData, setInventoryLevelsData] = useState(null);
  const [roomOccupancyData, setRoomOccupancyData] = useState(null);
  const [staffDistributionData, setStaffDistributionData] = useState(null);
  const [billingOverviewData, setBillingOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch Data (Keep existing useEffect) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- SIMULATION: Replace with actual parallel API calls ---
        const [
          patientRes, consultationRes, appointmentRes, inventoryRes, roomRes, staffRes, billingRes,
        ] = await Promise.all([
          new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ '0-17': 15, '18-40': 45, '41-65': 30, '65+': 10 }) }), 800)),
          new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'], counts: [350, 410, 380, 450, 420, 490, 510] }) }), 900)),
          new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ completed: 105, pending: 25, cancelled: 8, noShow: 7 }) }), 1000)),
          new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ labels: ['Guantes', 'Mascarillas', 'Jeringas', 'Analgésico X', 'Vendas', 'Alcohol'], levels: [85, 45, 75, 30, 90, 60] }) }), 1100)),
          new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ occupied: 92, free: 18, maintenance: 5 }) }), 1200)),
          new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ doctors: 42, nurses: 125, admin: 38, support: 55 }) }), 1300)),
          new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'], revenue: [25000, 28000, 26000, 31000, 29000, 33000, 35000], expenses: [18000, 19000, 19500, 21000, 20500, 22000, 23000] }) }), 1400)),
        ]);

        // Basic check - enhance if needed for specific failures
        if (!patientRes.ok || !consultationRes.ok || !appointmentRes.ok || !inventoryRes.ok || !roomRes.ok || !staffRes.ok || !billingRes.ok) {
             throw new Error('Fallo al cargar algunos datos del dashboard');
        }

        // --- Process and Format Data (Keep existing data processing) ---
        const patientApi = await patientRes.json();
        const consultationApi = await consultationRes.json();
        const appointmentApi = await appointmentRes.json();
        const inventoryApi = await inventoryRes.json();
        const roomApi = await roomRes.json();
        const staffApi = await staffRes.json();
        const billingApi = await billingRes.json();

        // --- Set State (Keep existing state setting logic) ---
        // Format Patient Demographics (Doughnut)
        setPatientDemographicsData({ labels: Object.keys(patientApi), datasets: [{ data: Object.values(patientApi), backgroundColor: ['#4BC0C0', '#FFCE56', '#FF6384', '#36A2EB', '#9966FF', '#FF9F40'], hoverBackgroundColor: ['#3aa9a9', '#ffc13a', '#ff4b6e', '#2a8cd5', '#834dff', '#ff8f2d'], borderColor: '#ffffff', hoverBorderColor: '#f0f0f0' }] });
        // Format Consultation Trends (Line)
        setConsultationTrendsData({ labels: consultationApi.labels, datasets: [{ label: 'Nº Consultas', data: consultationApi.counts, borderColor: getStyle('--cui-primary'), backgroundColor: `rgba(${getStyle('--cui-primary-rgb')}, 0.1)`, fill: true, tension: 0.4, pointBackgroundColor: getStyle('--cui-primary'), pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: getStyle('--cui-primary') }] });
        // Format Appointment Status (Pie)
        setAppointmentStatusData({ labels: ['Completadas', 'Pendientes', 'Canceladas', 'No Asistió'], datasets: [{ data: [appointmentApi.completed, appointmentApi.pending, appointmentApi.cancelled, appointmentApi.noShow], backgroundColor: ['#4CAF50', '#FFC107', '#F44336', '#9E9E9E'], hoverBackgroundColor: ['#66BB6A', '#FFCA28', '#EF5350', '#BDBDBD'], borderColor: '#ffffff', hoverBorderColor: '#f0f0f0' }] });
        // Format Inventory Levels (Bar) - Conditional Coloring
        setInventoryLevelsData({ labels: inventoryApi.labels, datasets: [{ label: 'Nivel (%)', data: inventoryApi.levels, backgroundColor: inventoryApi.levels.map(level => level < 25 ? `rgba(${getStyle('--cui-danger-rgb')}, 0.8)` : level < 50 ? `rgba(${getStyle('--cui-warning-rgb')}, 0.8)` : `rgba(${getStyle('--cui-success-rgb')}, 0.8)` ), borderColor: inventoryApi.levels.map(level => level < 25 ? getStyle('--cui-danger') : level < 50 ? getStyle('--cui-warning') : getStyle('--cui-success') ), borderWidth: 1, hoverBackgroundColor: inventoryApi.levels.map(level => level < 25 ? `rgba(${getStyle('--cui-danger-rgb')}, 1)` : level < 50 ? `rgba(${getStyle('--cui-warning-rgb')}, 1)` : `rgba(${getStyle('--cui-success-rgb')}, 1)` ), hoverBorderColor: inventoryApi.levels.map(level => level < 25 ? getStyle('--cui-danger-dark') : level < 50 ? getStyle('--cui-warning-dark') : getStyle('--cui-success-dark') ), }] });
        // Format Room Occupancy (Doughnut)
        setRoomOccupancyData({ labels: ['Ocupadas', 'Libres', 'Mantenimiento'], datasets: [{ data: [roomApi.occupied, roomApi.free, roomApi.maintenance], backgroundColor: [getStyle('--cui-warning'), getStyle('--cui-info'), getStyle('--cui-secondary')], hoverBackgroundColor: [getStyle('--cui-warning-dark'), getStyle('--cui-info-dark'), getStyle('--cui-secondary-dark')], borderColor: '#ffffff', hoverBorderColor: '#f0f0f0' }] });
        // Format Staff Distribution (Pie)
        setStaffDistributionData({ labels: ['Médicos', 'Enfermería', 'Administración', 'Soporte'], datasets: [{ data: [staffApi.doctors, staffApi.nurses, staffApi.admin, staffApi.support], backgroundColor: ['#36A2EB', '#FF6384', '#4BC0C0', '#FFCE56'], hoverBackgroundColor: ['#2a8cd5', '#ff4b6e', '#3aa9a9', '#ffc13a'], borderColor: '#ffffff', hoverBorderColor: '#f0f0f0' }] });
        // Format Billing Overview (Line)
        setBillingOverviewData({ labels: billingApi.labels, datasets: [ { label: 'Ingresos (€)', data: billingApi.revenue, borderColor: getStyle('--cui-success'), backgroundColor: `rgba(${getStyle('--cui-success-rgb')}, 0.1)`, fill: true, tension: 0.4, yAxisID: 'y', pointBackgroundColor: getStyle('--cui-success'), pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: getStyle('--cui-success') }, { label: 'Gastos (€)', data: billingApi.expenses, borderColor: getStyle('--cui-danger'), backgroundColor: `rgba(${getStyle('--cui-danger-rgb')}, 0.1)`, fill: true, tension: 0.4, yAxisID: 'y', pointBackgroundColor: getStyle('--cui-danger'), pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: getStyle('--cui-danger') } ] });

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "No se pudieron cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // --- Reusable Chart Card Renderer ---
  const renderChartCard = (title, chartData, ChartComponent, options = {}, icon = null, minBodyHeight = '600px') => {
    const baseOptions = {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { 
            padding: 20, 
            boxWidth: 15, 
            font: { size: 12 },
            usePointStyle: true
          }
        },
        tooltip: {
          enabled: true, 
          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 }, 
          padding: 12, 
          cornerRadius: 4, 
          displayColors: true, 
          boxPadding: 5,
          usePointStyle: true
        }
      },
      layout: {
        padding: { top: 20, bottom: 15, left: 15, right: 15 }
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 6
        }
      }
    };

    // Deep merge options
    const mergeOptions = (base, specific) => {
      const merged = { ...base };
      for (const key in specific) {
        if (specific.hasOwnProperty(key)) {
          if (typeof specific[key] === 'object' && specific[key] !== null && !Array.isArray(specific[key])) {
            merged[key] = mergeOptions(merged[key] || {}, specific[key]);
          } else {
            merged[key] = specific[key];
          }
        }
      }
      merged.maintainAspectRatio = false;
      return merged;
    };

    const chartOptions = mergeOptions(baseOptions, options);

    return (
      <CCard className="mb-4 shadow-sm" style={{ height: minBodyHeight }}>
        <CCardHeader className="d-flex align-items-center fw-semibold py-3">
          {icon && <CIcon icon={icon} className="me-2 text-primary" size="lg"/>}
          {title}
        </CCardHeader>
        <CCardBody className="p-3" style={{ height: 'calc(100% - 56px)' }}>
          {loading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <CSpinner color="primary" />
              <span className="ms-2">Cargando...</span>
            </div>
          )}
          {error && !loading && (
            <CAlert 
              color="danger" 
              className="d-flex flex-column justify-content-center align-items-center h-100 text-center"
            >
              <CIcon icon={cilFrown} className="mb-2" size="xl"/>
              Error al cargar datos.
            </CAlert>
          )}
          {!loading && !error && chartData && (
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              height: '100%',
              minHeight: '550px'
            }}>
              <ChartComponent
                data={chartData}
                options={chartOptions}
                style={{ height: '100%' }}
              />
            </div>
          )}
          {!loading && !error && !chartData && (
            <div className="d-flex justify-content-center align-items-center h-100 text-muted">
              No hay datos disponibles.
            </div>
          )}
        </CCardBody>
      </CCard>
    );
  };

  // --- Specific Chart Options ---
  const commonDoughnutPieOptions = { 
    plugins: { 
      legend: { 
        position: 'right', 
        labels: { 
          padding: 15, 
          boxWidth: 12,
          font: {
            size: 12
          }
        } 
      } 
    }, 
    cutout: '60%',
    spacing: 10
  };

  const commonBarOptions = { 
    scales: { 
      x: { 
        grid: { display: false },
        ticks: {
          font: {
            size: 12
          }
        }
      }, 
      y: { 
        beginAtZero: true, 
        grid: { 
          color: '#e2e2e2', 
          borderDash: [5, 5], 
        }, 
        ticks: { 
          padding: 10,
          font: {
            size: 12
          }
        } 
      } 
    }, 
    plugins: { 
      legend: { 
        display: false 
      } 
    }, 
    elements: { 
      bar: { 
        borderRadius: 4, 
        borderSkipped: false,
      } 
    }, 
    datasets: { 
      bar: { 
        barPercentage: 0.7, 
        categoryPercentage: 0.8 
      } 
    },
    indexAxis: 'x',
    barThickness: 'flex'
  };

  const commonLineOptions = { 
    scales: { 
      x: { 
        grid: { display: false },
        ticks: {
          font: {
            size: 12
          }
        }
      }, 
      y: { 
        beginAtZero: true, 
        grid: { 
          color: '#e2e2e2', 
          borderDash: [5, 5], 
        }, 
        ticks: { 
          padding: 10,
          font: {
            size: 12
          }
        } 
      } 
    }, 
    plugins: { 
      legend: { 
        position: 'top', 
        align: 'end', 
        labels: { 
          padding: 15, 
          boxWidth: 12,
          font: {
            size: 12
          }
        } 
      } 
    }, 
    elements: { 
      line: { 
        tension: 0.4, 
        borderWidth: 2.5 
      }, 
      point: { 
        radius: 4, 
        hoverRadius: 6, 
        hitRadius: 10 
      } 
    }, 
    interaction: { 
      mode: 'index', 
      intersect: false, 
    } 
  };

  const billingLineOptions = { 
    ...commonLineOptions, 
    scales: { 
      ...commonLineOptions.scales, 
      y: { 
        ...commonLineOptions.scales.y, 
        beginAtZero: false, 
        ticks: { 
          ...commonLineOptions.scales.y.ticks, 
          callback: function(value) { 
            return '€' + value.toLocaleString('es-ES'); 
          } 
        } 
      } 
    }, 
    plugins: { 
      ...commonLineOptions.plugins, 
      tooltip: { 
        ...commonLineOptions.plugins?.tooltip, 
        callbacks: { 
          label: function(context) { 
            let label = context.dataset.label || ''; 
            if (label) { 
              label += ': '; 
            } 
            if (context.parsed.y !== null) { 
              label += '€' + context.parsed.y.toLocaleString('es-ES'); 
            } 
            return label; 
          } 
        } 
      } 
    } 
  };

  // --- Render the Dashboard ---
  return (
    <div className="container-fluid p-4">
      {/* --- Title Row --- */}
      <CRow className="mb-4 align-items-center">
        <CCol xs={10} md={8}>
          <h3 className="text-primary d-flex align-items-center mb-0">
              <CIcon icon={cilSpeedometer} className="me-3" size="xl"/>
              Panel de Control Principal - MediAssist
          </h3>
        </CCol>
        <CCol xs={2} md={4} className="text-end">
            {loading && <CSpinner size="sm" color="primary" className="me-2"/>}
            {error && !loading && (
              <CBadge color="danger" shape="rounded-pill" className="px-3 py-2">
                <CIcon icon={cilFrown} className="me-1"/> Error
              </CBadge>
            )}
        </CCol>
      </CRow>

      {/* --- Chart Rows --- */}
      {/* Row 1: Key Performance Indicators (Line Charts) */}
      <CRow className="g-4 mb-4">
        <CCol xl={7}>
          {renderChartCard(
            "Tendencia de Consultas Mensuales",
            consultationTrendsData,
            CChartLine,
            commonLineOptions,
            cilGraph,
            '600px'
          )}
        </CCol>
        <CCol xl={5}>
          {renderChartCard(
            "Resumen Financiero Mensual (€)",
            billingOverviewData,
            CChartLine,
            billingLineOptions,
            cilDollar,
            '600px'
          )}
        </CCol>
      </CRow>

      {/* Row 2: Distributions (Doughnut/Pie) */}
      <CRow className="g-4 mb-4">
        <CCol lg={4} md={6}>
          {renderChartCard(
            "Demografía de Pacientes (Edad)",
            patientDemographicsData,
            CChartDoughnut,
            commonDoughnutPieOptions,
            cilPeople,
            '550px'
          )}
        </CCol>
        <CCol lg={4} md={6}>
          {renderChartCard(
            "Estado de Citas (Hoy)",
            appointmentStatusData,
            CChartPie,
            { ...commonDoughnutPieOptions, cutout: '0%' },
            cilCalendar,
            '550px'
          )}
        </CCol>
        <CCol lg={4} md={12}>
          {renderChartCard(
            "Ocupación de Habitaciones",
            roomOccupancyData,
            CChartDoughnut,
            commonDoughnutPieOptions,
            cilBed,
            '550px'
          )}
        </CCol>
      </CRow>

      {/* Row 3: Resources (Pie/Bar) */}
      <CRow className="g-4 mb-4">
        <CCol xl={4} lg={5}>
          {renderChartCard(
            "Distribución de Personal por Rol",
            staffDistributionData,
            CChartPie,
            { ...commonDoughnutPieOptions, cutout: '0%' },
            cilGroup,
            '550px'
          )}
        </CCol>
        <CCol xl={8} lg={7}>
          {renderChartCard(
            "Nivel de Inventario Crítico (%)",
            inventoryLevelsData,
            CChartBar,
            { ...commonBarOptions, scales: { ...commonBarOptions.scales, y: { ...commonBarOptions.scales.y, max: 100 } } },
            cilBasket,
            '550px'
          )}
        </CCol>
      </CRow>
    </div>
  );
};

export default MediAssistDynamicDashboard;