import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CSpinner,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CWidgetStatsA,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CAvatar,
  CBadge,
  CButton,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CListGroup,
  CListGroupItem,
  CProgress,
} from '@coreui/react';
import { CChartBar, CChartPie, CChartDoughnut, CChartLine } from '@coreui/react-chartjs';
import CIcon from '@coreui/icons-react';
import { getStyle } from '@coreui/utils';
import {
  cilPeople,
  cilCalendarCheck,
  cilBed,
  cilUser,
  cilArrowTop,
  cilArrowBottom,
  cilOptions,
  cilCalendar,
  cilPlus,
  cilArrowRight,
  cilReload,
  cilChevronLeft,
  cilChevronRight,
  cilBriefcase,
  cilStar,
  cilHospital, // Icono para Total de Doctores
  cilPen,      // Icono para Reservar Cita
  cilDoor,     // Icono para Disponibilidad de Habitaciones
  cilChartPie as cilVisitor // Icono para Visitantes Generales
} from '@coreui/icons';


const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDoctorTab, setActiveDoctorTab] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        setStats({
            totalDoctors: { value: 320, change: 2.5, increase: 510, chartData: [30, 40, 35, 50, 49, 60, 70] },
            bookAppointment: { value: 15140, change: 3.5, visitors: 8323, daily: 1435, chartData: [65, 59, 80, 81, 56, 55, 40] },
            roomAvailability: { value: 9140, change: 500, general: 100, private: 75 },
            overallVisitor: { value: 23804, change: 3.5, topClinicsText: "Clínicas más demandadas del mes", daily: 1000, chartData: [45, 70, 60, 80, 50, 75, 65] },
            patientOverview: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'],
                datasets: [
                    { label: 'Pacientes Totales', data: [3000, 4000, 9600, 5000, 7000, 6000, 4500], backgroundColor: '#3399ff', stack: 'Stack 0', barPercentage: 0.6 },
                    { label: 'Prom. Hospitalizados', data: [1000, 1500, 17363, 1800, 2500, 2200, 1600], backgroundColor: '#85c2ff', stack: 'Stack 0', barPercentage: 0.6  },
                    { label: 'Prom. Ambulatorios', data: [500, 700, 500, 800, 900, 750, 600], backgroundColor: '#cce5ff', stack: 'Stack 0', barPercentage: 0.6  }
                ],
                tooltipDataMar: { date: 'Mar 10, 2025', outpatient: 500, hospitalized: 17363, total: 9600 }
            },
            calendarActivities: {
                '2024-07-08': [
                    { time: '11:00 AM', title: 'Cita Dr. Sarah', color: 'primary' },
                    { time: '3:00 PM', title: 'Reunión Dentistas', color: 'info' },
                    { time: '4:00 PM', title: 'Paciente Ola M.', color: 'warning' }
                ]
            },
            topClinics: {
                labels: ['Dental', 'Internista', 'Neurólogo'],
                data: [120, 249, 165],
                total: 534,
                colors: ['#3399ff', '#85c2ff', '#ff99cc']
            },
            doctorsSchedule: {
                available: { count: 51, list: [ {name: 'Dr. Pedro Bashir', specialty: 'Anestesiólogo', avatar: 'avatars/1.jpg'}, {name: 'Dra. Ana Diongoli', specialty: 'Dermatóloga', avatar: 'avatars/4.jpg'} ]},
                unavailable: { count: 23, list: [ {name: 'Dra. Debora Fagbemi', specialty: 'Cardióloga', avatar: 'avatars/2.jpg'} ]},
                leave: { count: 9, list: [ ]}
            },
            appointments: [
                { name: 'Ruth Tubonimi', specialty: 'Gastroenteróloga', time: '09:40', avatar: 'avatars/3.jpg' },
                { name: 'José Obiano', specialty: 'Psiquiatra', time: '09:40', avatar: 'avatars/5.jpg' },
                { name: 'Timoteo Jibrin', specialty: 'Hematólogo', time: '09:40', avatar: 'avatars/6.jpg' },
                { name: 'Elizabeth Kanu', specialty: 'Oftalmóloga', time: '09:40', avatar: 'avatars/7.jpg' },
                { name: 'Simón Garba', specialty: 'Otorrinolaringólogo', time: '09:40', avatar: 'avatars/8.jpg' },
            ]
        });
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        setError(error.message || 'No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderCalendarDays = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDay = firstDayOfMonth.getDay();

    let days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(<CCol key={`empty-${i}`} className="p-1 text-center" style={{minHeight:'40px'}}></CCol>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
        const hasActivity = stats?.calendarActivities && stats.calendarActivities[dateKey];

      days.push(
        <CCol key={day} className="p-1 text-center">
            <CButton
                color={isToday ? "primary" : (hasActivity ? "light" : "transparent")}
                className={`w-100 p-1 ${isToday ? 'text-white' : (hasActivity ? 'fw-bold' : '')}`}
                variant={isToday || hasActivity ? undefined : 'ghost'}
                size="sm"
                style={{border: hasActivity && !isToday ? '1px solid #0d6efd' : undefined, minHeight:'40px'}}
            >
             {day}
          </CButton>
        </CCol>
      );
    }
    return days;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };


  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <CSpinner color="primary" />
        <span className="ms-3 text-body-secondary">Cargando datos del dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center text-danger">
          <p>Error al cargar los datos:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <p className="text-body-secondary">No hay datos disponibles para mostrar.</p>
      </div>
    );
  }

  const SmallLineChart = ({data, borderColor}) => (
    <CChartLine
        style={{ height: '30px', marginTop: '10px' }}
        data={{
            labels: ['', '', '', '', '', '', ''],
            datasets: [{
                backgroundColor: 'transparent',
                borderColor: borderColor || getStyle('--cui-gray-300'),
                borderWidth: 2,
                data: data,
                pointRadius: 0,
            }]
        }}
        options={{
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } }
        }}
    />
  );

  const cardStyle = { borderRadius:'1rem', height: '100%' };
  const widgetIconSize = "lg";

  return (
    <>
      <CRow className="g-3 mb-4">
        <CCol sm={6} lg={3}>
          <CCard style={{ ...cardStyle, backgroundColor: '#4f46e5', color: 'white' }}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <CIcon icon={cilHospital} size={widgetIconSize} />
                  <CIcon icon={cilOptions} />
                </div>
                <div style={{fontSize:'0.85rem', opacity:0.9}}>Total Doctores</div>
                <div className="fs-4 fw-bold mt-1">{stats.totalDoctors.value}+ <CBadge color="light" textColor="success" shape="rounded-pill" className="ms-1 align-middle" style={{fontSize:'0.65rem'}}>+{stats.totalDoctors.change}%</CBadge></div>
              </div>
              <div>
                <CChartBar
                  style={{ height: '50px', marginTop: '0.5rem' }}
                  data={{
                    labels: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
                    datasets: [ { backgroundColor: 'rgba(255,255,255,0.3)', borderColor: 'transparent', borderRadius: 3, data: stats.totalDoctors.chartData, barPercentage: 0.5, categoryPercentage: 0.7 }],
                  }}
                  options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }}
                />
                <div style={{fontSize:'0.75rem', marginTop:'0.5rem', opacity:0.8}}>Incremento de {stats.totalDoctors.increase} pacientes int. últimos 7 días</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard style={cardStyle}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <CIcon icon={cilPen} size={widgetIconSize} className="text-primary"/>
                  <CIcon icon={cilOptions} />
                </div>
                <div style={{fontSize:'0.85rem'}}>Reservar Cita</div>
                <div className="fs-4 fw-bold mt-1">{stats.bookAppointment.value.toLocaleString()} <CBadge color="success-light" textColor="success" shape="rounded-pill" className="ms-1 align-middle" style={{fontSize:'0.65rem'}}>+{stats.bookAppointment.change}%</CBadge></div>
                <div style={{fontSize:'0.75rem', color:'grey', marginTop:'0.1rem'}}>Datos últimos 7 días: {stats.bookAppointment.visitors.toLocaleString()} visitas</div>
              </div>
              <div>
                <SmallLineChart data={stats.bookAppointment.chartData} borderColor={getStyle('--cui-primary')} />
                <div className="text-end" style={{fontSize:'0.75rem', color:'grey', marginTop:'0.2rem'}}>{stats.bookAppointment.daily.toLocaleString()} hoy</div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

         <CCol sm={6} lg={3}>
            <CCard style={cardStyle}>
                <CCardBody className="p-3 d-flex flex-column justify-content-between">
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <CIcon icon={cilDoor} size={widgetIconSize} className="text-warning"/>
                            <CIcon icon={cilOptions} />
                        </div>
                        <div style={{fontSize:'0.85rem'}}>Disponibilidad Habitaciones</div>
                        <div className="fs-4 fw-bold mt-1">{stats.roomAvailability.value.toLocaleString()} <CBadge color="success-light" textColor="success" shape="rounded-pill" className="ms-1 align-middle" style={{fontSize:'0.65rem'}}>+{stats.roomAvailability.change}</CBadge></div>
                    </div>
                    <div className="mt-2">
                        <div className="d-flex justify-content-between align-items-center" style={{fontSize:'0.8rem'}}>
                            <span>Habitación General</span>
                            <span className="fw-semibold">{stats.roomAvailability.general}</span>
                        </div>
                        <CProgress thin value={(stats.roomAvailability.general / (stats.roomAvailability.general + stats.roomAvailability.private)) * 100} color="secondary" className="mt-1 mb-2"/>
                        <div className="d-flex justify-content-between align-items-center" style={{fontSize:'0.8rem'}}>
                            <span>Habitación Privada</span>
                            <span className="fw-semibold">{stats.roomAvailability.private}</span>
                        </div>
                        <CProgress thin value={(stats.roomAvailability.private / (stats.roomAvailability.general + stats.roomAvailability.private)) * 100} color="warning" className="mt-1"/>
                    </div>
                </CCardBody>
            </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard style={cardStyle}>
            <CCardBody className="p-3 d-flex flex-column justify-content-between">
                <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                    <CIcon icon={cilVisitor} size={widgetIconSize} className="text-info"/>
                    <CIcon icon={cilOptions} />
                    </div>
                    <div style={{fontSize:'0.85rem'}}>Visitantes Generales</div>
                    <div className="fs-4 fw-bold mt-1">{stats.overallVisitor.value.toLocaleString()} <CBadge color="success-light" textColor="success" shape="rounded-pill" className="ms-1 align-middle" style={{fontSize:'0.65rem'}}>+{stats.overallVisitor.change}%</CBadge></div>
                    <div style={{fontSize:'0.75rem', color:'grey', marginTop:'0.1rem'}}>{stats.overallVisitor.topClinicsText}</div>
                </div>
                <div>
                    <SmallLineChart data={stats.overallVisitor.chartData} borderColor={getStyle('--cui-info')} />
                    <div className="text-end" style={{fontSize:'0.75rem', color:'grey', marginTop:'0.2rem'}}>{stats.overallVisitor.daily.toLocaleString()} hoy</div>
                </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol lg={8}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-semibold"><CIcon icon={cilBriefcase} className="me-2"/>Resumen de Pacientes</h6>
              <CDropdown alignment="end">
                <CDropdownToggle color="transparent" caret={false} className="p-0 text-muted small">
                  Últimos 30 días <CIcon icon={cilOptions} className="ms-1"/>
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem>Últimos 7 días</CDropdownItem>
                  <CDropdownItem>Últimos 30 días</CDropdownItem>
                  <CDropdownItem>Últimos 90 días</CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CCardHeader>
            <CCardBody>
                <div className="d-flex justify-content-start small mb-3">
                    {stats.patientOverview.datasets.map(ds => (
                        <div key={ds.label} className="me-3 d-flex align-items-center">
                            <span style={{display:'inline-block', width:'10px', height:'10px', backgroundColor:ds.backgroundColor, borderRadius:'50%', marginRight:'5px'}}></span>
                            {ds.label}
                        </div>
                    ))}
                </div>
                <CChartBar
                    style={{ height: '250px' }}
                    data={{
                        labels: stats.patientOverview.labels,
                        datasets: stats.patientOverview.datasets,
                    }}
                    options={{
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                enabled: true, mode: 'index', intersect: false,
                                callbacks: {
                                     title: function(tooltipItems) {
                                        const monthIndex = tooltipItems[0].dataIndex;
                                        const month = stats.patientOverview.labels[monthIndex];
                                        if(month === 'Mar' && stats.patientOverview.tooltipDataMar) {
                                            return stats.patientOverview.tooltipDataMar.date;
                                        }
                                        return month;
                                    },
                                    label: function(context) {
                                        let label = context.dataset.label || '';
                                        if (label) { label += ': '; }
                                        if (context.parsed.y !== null) {
                                            if(context.dataset.label === 'Prom. Hospitalizados' && context.label === 'Mar' && stats.patientOverview.tooltipDataMar) {
                                                label += '$' + stats.patientOverview.tooltipDataMar.hospitalized.toLocaleString();
                                            } else if(context.dataset.label === 'Prom. Ambulatorios' && context.label === 'Mar' && stats.patientOverview.tooltipDataMar) {
                                                 label += stats.patientOverview.tooltipDataMar.outpatient.toLocaleString();
                                            }
                                             else if(context.dataset.label === 'Pacientes Totales' && context.label === 'Mar' && stats.patientOverview.tooltipDataMar) {
                                                 label += stats.patientOverview.tooltipDataMar.total.toLocaleString();
                                            }
                                            else {
                                                label += context.parsed.y.toLocaleString();
                                            }
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { grid: { display: false }, stacked: true, ticks:{font:{size:10}} },
                            y: { grid: { color: getStyle('--cui-border-color-translucent') }, stacked: true, ticks: { callback: (value) => `${value/1000}k`, font:{size:10} } }
                        },
                    }}
                />
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <CButton color="transparent" size="sm" className="p-1" onClick={() => changeMonth(-1)}><CIcon icon={cilChevronLeft}/></CButton>
              <h6 className="mb-0 fw-semibold">{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h6>
              <CButton color="transparent" size="sm" className="p-1" onClick={() => changeMonth(1)}><CIcon icon={cilChevronRight}/></CButton>
            </CCardHeader>
            <CCardBody className="p-2">
              <CRow xs={{cols: 7}} className="text-center small text-muted mb-2">
                {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => <CCol key={day} className="px-0">{day}</CCol>)}
              </CRow>
              <CRow xs={{cols: 7}} className="g-1">
                {renderCalendarDays()}
              </CRow>
              <div className="mt-2 p-2" style={{backgroundColor:'#2c3e50', color:'white', borderRadius:'0.5rem'}}>
                <h6 className="small mb-1">Detalle de Actividad</h6>
                {stats.calendarActivities['2024-07-08'] ? stats.calendarActivities['2024-07-08'].map((activity, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center small py-1" style={{fontSize:'0.75rem'}}>
                        <span><CBadge style={{backgroundColor: getStyle(`--cui-${activity.color}`)}} shape="circle" className="p-1 me-1"/>{activity.title}</span>
                        <span>{activity.time}</span>
                    </div>
                )) : <div className="small text-center py-2 opacity-75">Sin actividades para hoy.</div>}
                 <CButton color="light" variant="outline" size="sm" className="w-100 mt-2 text-white border-white" style={{fontSize:'0.8rem'}}>
                    <CIcon icon={cilPlus} className="me-1"/> Añadir Item
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="g-3 mb-4">
        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold"><CIcon icon={cilStar} className="me-2 text-danger"/>Top 3 Clínicas Solicitadas</h6>
                <CIcon icon={cilOptions} className="text-muted"/>
            </CCardHeader>
            <CCardBody className="d-flex flex-column justify-content-center align-items-center pt-2 pb-3">
              <div style={{width:'180px', height:'180px', position:'relative', margin:'0.5rem 0'}}>
                <CChartDoughnut
                    data={{
                        labels: stats.topClinics.labels,
                        datasets: [{ data: stats.topClinics.data, backgroundColor: stats.topClinics.colors, borderColor:'white', borderWidth:3, hoverBorderWidth:3 }],
                    }}
                    options={{
                        maintainAspectRatio: false, cutout: '75%',
                        plugins: { legend: { display: false }, tooltip:{enabled:true} }
                    }}
                />
                <div className="position-absolute top-50 start-50 translate-middle text-center">
                    <div className="text-muted" style={{fontSize:'0.7rem'}}>Pacientes Tot.</div>
                    <div className="fs-5 fw-bold" style={{lineHeight:'1.2'}}>{stats.topClinics.total}</div>
                </div>
              </div>
              <div className="mt-2 w-100 px-2">
                {stats.topClinics.labels.map((label, index) => (
                    <div key={label} className="d-flex justify-content-between align-items-center small my-1 py-1">
                        <span><CBadge style={{backgroundColor: stats.topClinics.colors[index]}} shape="circle" className="p-1 me-2"/>{label}</span>
                        <span className="fw-semibold">{stats.topClinics.data[index]}</span>
                    </div>
                ))}
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="p-2">
                <CNav variant="pills" role="tablist" fill className="small">
                    <CNavItem role="presentation">
                        <CNavLink active={activeDoctorTab === 1} onClick={() => setActiveDoctorTab(1)} href="#" role="tab">Disponibles <CBadge color="light" textColor="dark" className="ms-1">{stats.doctorsSchedule.available.count}</CBadge></CNavLink>
                    </CNavItem>
                    <CNavItem role="presentation">
                        <CNavLink active={activeDoctorTab === 2} onClick={() => setActiveDoctorTab(2)} href="#" role="tab">No Disp. <CBadge color="light" textColor="dark" className="ms-1">{stats.doctorsSchedule.unavailable.count}</CBadge></CNavLink>
                    </CNavItem>
                    <CNavItem role="presentation">
                        <CNavLink active={activeDoctorTab === 3} onClick={() => setActiveDoctorTab(3)} href="#" role="tab">Licencia <CBadge color="light" textColor="dark" className="ms-1">{stats.doctorsSchedule.leave.count}</CBadge></CNavLink>
                    </CNavItem>
                </CNav>
            </CCardHeader>
            <CCardBody className="p-0" style={{maxHeight: '300px', overflowY: 'auto'}}>
                <CTabContent>
                    {[1,2,3].map(tabId => (
                        <CTabPane role="tabpanel" key={tabId} visible={activeDoctorTab === tabId}>
                            <CListGroup flush>
                                {(tabId === 1 ? stats.doctorsSchedule.available.list : tabId === 2 ? stats.doctorsSchedule.unavailable.list : stats.doctorsSchedule.leave.list)
                                .map((doc, index) => (
                                    <CListGroupItem key={index} className="d-flex justify-content-between align-items-center px-3 py-2">
                                        <div className="d-flex align-items-center">
                                            <CAvatar src={doc.avatar} size="md" className="me-2"/>
                                            <div>
                                                <div className="fw-semibold small">{doc.name}</div>
                                                <div className="extra-small text-muted">{doc.specialty}</div>
                                            </div>
                                        </div>
                                        <CBadge color={tabId === 1 ? "success-light" : tabId === 2 ? "danger-light" : "warning-light"}
                                                textColor={tabId === 1 ? "success" : tabId === 2 ? "danger" : "warning"}
                                                shape="rounded-pill" className="small">
                                            {tabId === 1 ? "Disponible" : tabId === 2 ? "No Disponible" : "Licencia"}
                                        </CBadge>
                                    </CListGroupItem>
                                ))}
                                {(tabId === 1 && stats.doctorsSchedule.available.list.length === 0) ||
                                 (tabId === 2 && stats.doctorsSchedule.unavailable.list.length === 0) ||
                                 (tabId === 3 && stats.doctorsSchedule.leave.list.length === 0) ?
                                 <CListGroupItem className="text-center text-muted small p-3">No hay doctores en esta categoría.</CListGroupItem> : null
                                }
                            </CListGroup>
                        </CTabPane>
                    ))}
                </CTabContent>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol lg={4}>
          <CCard style={cardStyle}>
            <CCardHeader className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold"><CIcon icon={cilCalendar} className="me-2 text-success"/>Citas de Hoy</h6>
                <CIcon icon={cilOptions} className="text-muted"/>
            </CCardHeader>
            <CCardBody className="p-0" style={{maxHeight: '300px', overflowY: 'auto'}}>
                <CListGroup flush>
                    {stats.appointments.map((apt, index) => (
                        <CListGroupItem key={index} className="d-flex justify-content-between align-items-center px-3 py-2">
                             <div className="d-flex align-items-center">
                                <CAvatar src={apt.avatar} size="md" className="me-2"/>
                                <div>
                                    <div className="fw-semibold small">{apt.name}</div>
                                    <div className="extra-small text-muted">{apt.specialty}</div>
                                </div>
                            </div>
                            <div className="text-end">
                                <div className="small text-muted">Hoy</div>
                                <div className="fw-semibold small">{apt.time}</div>
                            </div>
                        </CListGroupItem>
                    ))}
                     {stats.appointments.length === 0 &&
                        <CListGroupItem className="text-center text-muted small p-3">No hay citas programadas para hoy.</CListGroupItem>
                     }
                </CListGroup>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default Dashboard;